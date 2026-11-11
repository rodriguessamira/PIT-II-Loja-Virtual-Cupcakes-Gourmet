
import os
import mysql.connector
import json
from decimal import Decimal
from dotenv import load_dotenv
from flask import Flask, render_template, request, session, redirect, url_for, jsonify
from werkzeug.security import generate_password_hash, check_password_hash

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY")

print("Chave secreta carregada:", bool(app.secret_key))


def conectar_banco():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME")
    )



@app.route("/")
def inicio():
    conexao = None
    cursor = None

    try:
        conexao = conectar_banco()
        cursor = conexao.cursor(dictionary=True)

        cursor.execute("""
            SELECT id_produto, nome, imagem, descricao, preco, disponibilidade
            FROM PRODUTO
            WHERE disponibilidade = 1
        """)

        produtos = cursor.fetchall()

        return render_template("index.html", produtos=produtos)

    except mysql.connector.Error as erro:
        print(f"Erro ao carregar produtos: {erro}")
        return "Não foi possível carregar os produtos.", 500

    finally:
        if cursor:
            cursor.close()

        if conexao and conexao.is_connected():
            conexao.close()



@app.route("/sacola")
def sacola():
    return render_template("sacola.html")





@app.route("/checkout", methods=["GET", "POST"])
def checkout():
    if "id_usuario" not in session:
        return redirect(url_for("login", proxima="checkout"))

    if request.method == "POST":

        dados_cliente = {
            "nome": request.form.get("nome", "").strip(),
            "email": request.form.get("email", "").strip(),
            "telefone": request.form.get("telefone", "").strip(),
            "cep": request.form.get("cep", "").strip(),
            "endereco": request.form.get("endereco", "").strip(),
            "numero": request.form.get("numero", "").strip(),
            "complemento": request.form.get("complemento", "").strip(),
            "bairro": request.form.get("bairro", "").strip(),
            "cidade": request.form.get("cidade", "").strip(),
            "estado": request.form.get("estado", "").strip(),
            "pagamento": request.form.get("pagamento", "").strip()
        }

        sacola_json = request.form.get("sacola_json", "")

        try:
            sacola_recebida = json.loads(sacola_json)

            if not isinstance(sacola_recebida, list) or not sacola_recebida:
                return "A sacola está vazia ou possui formato inválido.", 400

            conexao = None
            cursor = None

            try:
                conexao = conectar_banco()
                cursor = conexao.cursor(dictionary=True)

                produtos_validados = []
                valor_total = Decimal("0.00")

                # Valida os produtos e consulta os preços no MySQL
                for item in sacola_recebida:

                    try:
                        id_produto = int(item["id"])
                        quantidade = int(item["quantidade"])

                        if quantidade <= 0:
                            return "Quantidade de produto inválida.", 400

                    except (KeyError, TypeError, ValueError):
                        return "Dados de produto inválidos.", 400

                    cursor.execute("""
                        SELECT id_produto, nome, preco, disponibilidade
                        FROM PRODUTO
                        WHERE id_produto = %s
                    """, (id_produto,))

                    produto = cursor.fetchone()

                    if not produto:
                        return f"Produto {id_produto} não encontrado.", 400

                    if produto["disponibilidade"] != 1:
                        return f"O produto {produto['nome']} não está disponível.", 400

                    preco_unitario = Decimal(str(produto["preco"]))
                    subtotal = preco_unitario * quantidade

                    produtos_validados.append({
                        "id_produto": produto["id_produto"],
                        "nome": produto["nome"],
                        "quantidade": quantidade,
                        "valor_unitario": preco_unitario,
                        "subtotal": subtotal
                    })

                    valor_total += subtotal

                print("Produtos validados:", produtos_validados)
                print("Valor total calculado:", valor_total)

                # Monta o endereço de entrega
                partes_endereco = [
                    dados_cliente["endereco"],
                    dados_cliente["numero"],
                    dados_cliente["complemento"],
                    dados_cliente["bairro"],
                    dados_cliente["cidade"],
                    dados_cliente["estado"],
                    f"CEP: {dados_cliente['cep']}"
                ]

                endereco_entrega = ", ".join(
                    parte for parte in partes_endereco if parte
                )

                if len(endereco_entrega) > 255:
                    return "O endereço de entrega ultrapassa o limite permitido.", 400

                # Identifica a forma de pagamento
                formas_pagamento = {
                    "pix": "PIX",
                    "cartao": "Cartão"
                }

                forma_pagamento = formas_pagamento.get(
                    dados_cliente["pagamento"].lower()
                )

                if not forma_pagamento:
                    return "Forma de pagamento inválida.", 400

                print("Endereço de entrega:", endereco_entrega)
                print("Forma de pagamento:", forma_pagamento)

               # Utiliza a transação já aberta pela conexão
                try:

                    # 1. Registra o pedido
                    cursor.execute("""
                        INSERT INTO PEDIDO
                        (id_usuario, valor_total, endereco_entrega, id_status)
                        VALUES (%s, %s, %s, %s)
                    """, (
                        session["id_usuario"],
                        valor_total,
                        endereco_entrega,
                        1
                    ))

                    # Recupera o ID gerado pelo MySQL
                    id_pedido = cursor.lastrowid

                    print("Pedido registrado. ID:", id_pedido)

                    # 2. Registra os produtos do pedido
                    for produto in produtos_validados:

                        cursor.execute("""
                            INSERT INTO ITEM_PEDIDO
                            (id_pedido, id_produto, quantidade, valor_unitario, subtotal)
                            VALUES (%s, %s, %s, %s, %s)
                        """, (
                            id_pedido,
                            produto["id_produto"],
                            produto["quantidade"],
                            produto["valor_unitario"],
                            produto["subtotal"]
                        ))

                    print("Itens do pedido registrados.")

                    # 3. Registra o pagamento
                    cursor.execute("""
                        INSERT INTO PAGAMENTO
                        (id_pedido, forma_pagamento, situacao_pagamento)
                        VALUES (%s, %s, %s)
                    """, (
                        id_pedido,
                        forma_pagamento,
                        "Pendente"
                    ))

                    print("Pagamento registrado.")

                    # Confirma todas as operações
                    conexao.commit()

                    print("Pedido gravado com sucesso!")

                    return jsonify({
                        "sucesso": True,
                        "id_pedido": id_pedido,
                        "mensagem": "Pedido realizado com sucesso!"
                    }), 200

                except mysql.connector.Error as erro:

                    # Desfaz todas as operações em caso de falha
                    conexao.rollback()

                    print("Erro ao registrar pedido:", erro)

                    return "Não foi possível registrar seu pedido. Tente novamente.", 500

            finally:
                if cursor:
                    cursor.close()

                if conexao and conexao.is_connected():
                    conexao.close()

        except (json.JSONDecodeError, TypeError):
            return "Não foi possível interpretar os produtos da sacola.", 400

    return render_template("checkout.html")

@app.route("/login", methods=["GET", "POST"])
def login():
    mensagem = None

    if request.method == "POST":

        email = request.form.get("email", "").strip()
        senha = request.form.get("senha", "")

        if not email or not senha:
            mensagem = "Informe seu e-mail e sua senha."

        else:
            conexao = None
            cursor = None

            try:
                conexao = conectar_banco()
                cursor = conexao.cursor(dictionary=True)

                comando = """
                    SELECT id_usuario, nome, email, senha, perfil
                    FROM USUARIO
                    WHERE email = %s
                """

                cursor.execute(comando, (email,))
                usuario = cursor.fetchone()

                if usuario and check_password_hash(usuario["senha"], senha):

                    session["id_usuario"] = usuario["id_usuario"]
                    session["nome"] = usuario["nome"]
                    session["perfil"] = usuario["perfil"]

                    if request.args.get("proxima") == "checkout":
                        return redirect(url_for("checkout"))

                    return redirect(url_for("inicio"))

                else:
                    mensagem = "E-mail ou senha incorretos."

            except mysql.connector.Error as erro:
                print(f"Erro ao realizar login: {erro}")
                mensagem = "Não foi possível realizar o login. Tente novamente."

            finally:
                if cursor:
                    cursor.close()

                if conexao and conexao.is_connected():
                    conexao.close()

    return render_template("login.html", mensagem=mensagem)
@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("inicio"))


@app.route("/cadastro", methods=["GET", "POST"])
def cadastro():
    mensagem = None

    if request.method == "POST":

        nome = request.form.get("nome", "").strip()
        email = request.form.get("email", "").strip()
        telefone = request.form.get("telefone", "").strip()
        senha = request.form.get("senha", "")
        confirmar_senha = request.form.get("confirmar_senha", "")

        if not nome or not email or not telefone or not senha:
            mensagem = "Preencha todos os campos obrigatórios."

        elif len(senha) < 8:
            mensagem = "A senha deve possuir pelo menos 8 caracteres."

        elif senha != confirmar_senha:
            mensagem = "As senhas não coincidem."

        else:
            conexao = None
            cursor = None

            try:
                conexao = conectar_banco()
                cursor = conexao.cursor()

                senha_hash = generate_password_hash(senha)

                comando = """
                    INSERT INTO USUARIO
                    (nome, email, telefone, senha)
                    VALUES (%s, %s, %s, %s)
                """

                cursor.execute(
                    comando,
                    (nome, email, telefone, senha_hash)
                )

                conexao.commit()

                mensagem = "Cadastro realizado com sucesso!"

            except mysql.connector.IntegrityError:
                mensagem = "Este e-mail já está cadastrado."

            except mysql.connector.Error as erro:
                print(f"Erro ao cadastrar usuário: {erro}")
                mensagem = "Não foi possível realizar o cadastro. Tente novamente."

            finally:
                if cursor:
                    cursor.close()

                if conexao and conexao.is_connected():
                    conexao.close()

    return render_template("cadastro.html", mensagem=mensagem)


if __name__ == "__main__":
    app.run(debug=True)
