import os
import mysql.connector
from dotenv import load_dotenv

# Carrega as configurações do arquivo .env
load_dotenv()

try:
    conexao = mysql.connector.connect(
        host=os.getenv("DB_HOST"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME")
    )

    if conexao.is_connected():
        print("Conexão com o MySQL realizada com sucesso!")

    conexao.close()

except mysql.connector.Error as erro:
    print("Erro ao conectar ao MySQL:", erro)