let sacola = JSON.parse(localStorage.getItem("sacola")) || [];

const botoesAdicionar = document.querySelectorAll(".btn-adicionar");

const contadorSacola =
    document.getElementById("contador-sacola") ||
    document.getElementById("badge-count");


// ======================================================
// CONTADOR DA SACOLA
// ======================================================

function atualizarContadorSacola() {

    const quantidadeTotal = sacola.reduce(function (total, item) {
        return total + item.quantidade;
    }, 0);


    // Contador da sacola no cabeçalho
    if (contadorSacola) {

        contadorSacola.textContent = quantidadeTotal;

    }


    // Contador da sacola no menu mobile
    const contadorMenu =
        document.getElementById("drawer-cart-count");

    if (contadorMenu) {

        if (quantidadeTotal === 1) {

            contadorMenu.textContent = "1 item";

        } else {

            contadorMenu.textContent =
                quantidadeTotal + " itens";

        }

    }
}


// ======================================================
// CONTADOR DE ITENS DA SACOLA
// ======================================================

function atualizarContadorItensSacola() {

    const contadorItens = document.getElementById("cart-items-counter");

    if (!contadorItens) {
        return;
    }

    const quantidadeTotal = sacola.reduce(function (total, item) {
        return total + item.quantidade;
    }, 0);

    if (quantidadeTotal === 0) {

        contadorItens.textContent = "0 itens na sacola";

    } else if (quantidadeTotal === 1) {

        contadorItens.textContent = "1 item na sacola";

    } else {

        contadorItens.textContent = quantidadeTotal + " itens na sacola";
    }
}


// ======================================================
// RESUMO DA SACOLA
// ======================================================

function atualizarResumoSacola() {

    const subtotalElemento = document.getElementById("summary-subtotal");
    const totalElemento = document.getElementById("summary-total");

    if (!subtotalElemento || !totalElemento) {
        return;
    }

    const subtotal = sacola.reduce(function (total, item) {
        return total + (item.preco * item.quantidade);
    }, 0);

    subtotalElemento.textContent =
        "R$ " + subtotal.toFixed(2).replace(".", ",");

    totalElemento.textContent =
        "R$ " + subtotal.toFixed(2).replace(".", ",");
}


// ======================================================
// RENDERIZA A SACOLA
// ======================================================

function renderizarSacola() {

    const container = document.getElementById("cart-items-container");

    if (!container) {
        return;
    }

    container.innerHTML = "";

    const estadoVazio = document.getElementById("empty-cart-state");

    if (estadoVazio) {
        estadoVazio.classList.toggle("hidden", sacola.length > 0);
    }

    container.classList.toggle("hidden", sacola.length === 0);

    sacola.forEach(function (item) {

        const produtoHTML = `
            <article class="cart-item bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-4 sm:p-5 custom-shadow">
                
                <div class="flex-grow w-full flex flex-col justify-between gap-3">

                    <div>
                        <h2 class="font-headline-md text-title-lg text-on-surface">
                            ${item.nome}
                        </h2>

                        <p class="text-body-sm text-on-surface-variant mt-1">
                            Unitário: R$ ${item.preco.toFixed(2).replace(".", ",")}
                        </p>
                    </div>

                    <div class="flex items-center justify-between pt-2 border-t border-surface-container">

                        <div class="flex items-center gap-2">

                            <button
                                type="button"
                                class="btn-diminuir w-8 h-8 rounded-full border border-outline-variant flex items-center justify-center"
                                data-id="${item.id}">
                                −
                            </button>

                            <span class="quantidade-produto w-8 text-center font-bold text-on-surface">
                                ${item.quantidade}
                            </span>

                            <button
                                type="button"
                                class="btn-aumentar w-8 h-8 rounded-full border border-outline-variant flex items-center justify-center"
                                data-id="${item.id}">
                                +
                            </button>

                        </div>

                        <div class="text-right">

                            <span class="text-body-sm text-on-surface-variant block text-xs">
                                Subtotal
                            </span>

                            <span class="font-title-md text-title-md font-bold text-on-surface">
                                R$ ${(item.preco * item.quantidade).toFixed(2).replace(".", ",")}
                            </span>

                        </div>

                    </div>

                </div>

            </article>
        `;

        container.insertAdjacentHTML("beforeend", produtoHTML);
    });

    configurarBotoesQuantidade();

    atualizarResumoSacola();

    atualizarContadorSacola();

    atualizarContadorItensSacola();
}


// ======================================================
// BOTÕES + E − DA SACOLA
// ======================================================

function configurarBotoesQuantidade() {

    document.querySelectorAll(".btn-aumentar").forEach(function (botao) {

        botao.addEventListener("click", function () {

            const idProduto = botao.dataset.id;

            const produto = sacola.find(function (item) {
                return item.id === idProduto;
            });

            if (produto) {

                produto.quantidade++;

                localStorage.setItem("sacola", JSON.stringify(sacola));

                renderizarSacola();

            }

        });

    });


    document.querySelectorAll(".btn-diminuir").forEach(function (botao) {

        botao.addEventListener("click", function () {

            const idProduto = botao.dataset.id;

            const produto = sacola.find(function (item) {
                return item.id === idProduto;
            });

            if (produto) {

                if (produto.quantidade > 1) {

                    produto.quantidade--;

                } else {

                    const indice = sacola.findIndex(function (item) {
                        return item.id === idProduto;
                    });

                    sacola.splice(indice, 1);
                }

                localStorage.setItem("sacola", JSON.stringify(sacola));

                renderizarSacola();

            }

        });

    });
}


// ======================================================
// CARREGAR SACOLA
// ======================================================

function carregarSacola() {

    const sacolaSalva =
        JSON.parse(localStorage.getItem("sacola")) || [];

    console.log("Sacola carregada:", sacolaSalva);
}


// ======================================================
// RENDERIZA RESUMO DO CHECKOUT
// ======================================================

function renderizarResumoCheckout() {

    const container =
        document.getElementById("checkout-items-container");

    if (!container) {
        return;
    }

    container.innerHTML = "";

    let subtotal = 0;
    let quantidadeTotal = 0;

    sacola.forEach(function (item) {

        const subtotalProduto =
            item.preco * item.quantidade;

        subtotal += subtotalProduto;
        quantidadeTotal += item.quantidade;
        const produtoHTML = `
            <div class="p-5 flex items-center gap-4">

                <div class="flex-1">

                    <h3 class="font-headline-md text-title-lg text-on-surface">
                        ${item.nome}
                    </h3>

                    <p class="text-body-sm text-on-surface-variant mt-1">
                        ${item.quantidade} x R$ ${item.preco.toFixed(2).replace(".", ",")}
                    </p>

                </div>

                <div class="text-right">

                    <span class="font-title-md text-title-md font-bold text-on-surface">
                        R$ ${subtotalProduto.toFixed(2).replace(".", ",")}
                    </span>

                </div>

            </div>
        `;

        container.insertAdjacentHTML(
            "beforeend",
            produtoHTML
        );
    });


    // Atualiza o subtotal do pedido

    const subtotalElemento =
        document.getElementById("checkout-subtotal");

    if (subtotalElemento) {

        subtotalElemento.textContent =
            "R$ " + subtotal.toFixed(2).replace(".", ",");
    }


    // Atualiza o total do pedido

    const totalElemento =
        document.getElementById("checkout-total");

    if (totalElemento) {

        totalElemento.textContent =
            "R$ " + subtotal.toFixed(2).replace(".", ",");
    }
    const contadorItens =
    document.getElementById("checkout-items-counter");

    if (contadorItens) {

        if (quantidadeTotal === 1) {

            contadorItens.textContent = "1 item";

        } else {

            contadorItens.textContent =
                quantidadeTotal + " itens";
        }
    }
}


// ======================================================
// INICIALIZAÇÃO
// ======================================================

atualizarContadorSacola();

atualizarContadorItensSacola();

carregarSacola();

renderizarSacola();

renderizarResumoCheckout();


// ======================================================
// BOTÕES "ADICIONAR À SACOLA"
// ======================================================

botoesAdicionar.forEach(function (botao) {

    botao.addEventListener("click", function () {

        const produto = botao.closest("article");

        const nomeProduto =
            produto.dataset.produto;

        const precoProduto =
            produto.dataset.preco;

        const produtoExistente = sacola.find(function (item) {
            return item.id === produto.dataset.id;
        });

        if (produtoExistente) {

            produtoExistente.quantidade++;

        } else {

            const item = {

                id: produto.dataset.id,

                nome: nomeProduto,

                preco: Number(precoProduto),

                quantidade: 1
            };

            sacola.push(item);
        }

        atualizarContadorSacola();

        atualizarContadorItensSacola();

        localStorage.setItem(
            "sacola",
            JSON.stringify(sacola)
        );

        alert(
            nomeProduto +
            " foi adicionado à sacola!"
        );

    });

});
// ======================================================
// VALIDAÇÃO DO CHECKOUT
// ======================================================


function configurarBotoesFinalizarPedido() {

    const formulario = document.getElementById("checkout-form");

    const botaoDesktop = document.getElementById("btn-finalizar-pedido");
    const botaoMobile = document.getElementById("btn-finalizar-pedido-mobile");

    if (!formulario) {
        return;
    }

    let enviandoPedido = false;

    formulario.addEventListener("submit", async function (evento) {

        evento.preventDefault();

        // Impede envios duplicados
        if (enviandoPedido) {
            return;
        }

        // 1. Valida a sacola
        if (sacola.length === 0) {
            alert("Sua sacola está vazia. Adicione produtos antes de finalizar o pedido.");
            return;
        }

        // 2. Valida os dados do cliente
        if (!validarDadosCliente()) {
            return;
        }

        // 3. Valida o endereço
        if (!validarEndereco()) {
            return;
        }

        // 4. Valida a forma de pagamento
        if (!validarFormaPagamento()) {
            return;
        }

        // 5. Prepara os produtos para envio ao Flask
        const campoSacola = document.getElementById("sacola-json");

        if (campoSacola) {
            campoSacola.value = JSON.stringify(sacola);
        }

        try {

            enviandoPedido = true;

            if (botaoDesktop) botaoDesktop.disabled = true;
            if (botaoMobile) botaoMobile.disabled = true;

            // 6. Envia o formulário ao Flask
            const resposta = await fetch(formulario.action, {
                method: "POST",
                body: new FormData(formulario),
                headers: {
                    "Accept": "application/json"
                }
            });

            const respostaTexto = await resposta.text();

            let dados;

            try {
                dados = JSON.parse(respostaTexto);
            } catch {
                throw new Error(
                    respostaTexto || "Não foi possível processar o pedido."
                );
            }

            if (!resposta.ok || !dados.sucesso) {
                throw new Error(
                    dados.mensagem || "Não foi possível registrar seu pedido."
                );
            }

            // 7. Limpa a sacola somente após o sucesso
            localStorage.removeItem("sacola");
            sacola = [];

            // 8. Exibe o modal com o número real do pedido
            const modal = document.getElementById("confirmation-modal");
            const numeroPedido = document.getElementById("numero-pedido");

            if (!modal || !numeroPedido) {
                alert("Pedido registrado com sucesso! Número: " + dados.id_pedido);
                window.location.href = "/";
                return;
            }

            numeroPedido.textContent =
                "#" + String(dados.id_pedido).padStart(4, "0");

            modal.classList.remove("hidden");

            // 9. Redireciona após 4 segundos
            setTimeout(function () {
                window.location.href = "/";
            }, 4000);

        } catch (erro) {

            console.error("Erro ao finalizar pedido:", erro);

            alert(erro.message || "Ocorreu um erro ao finalizar o pedido.");

            enviandoPedido = false;

            if (botaoDesktop) botaoDesktop.disabled = false;
            if (botaoMobile) botaoMobile.disabled = false;

        }

    });
}

// ======================================================
// VALIDAÇÃO DOS DADOS DO CLIENTE
// ======================================================

function validarDadosCliente() {

    const nome =
        document.getElementById("nome-cliente");

    const email =
        document.getElementById("email-cliente");

    const telefone =
        document.getElementById("telefone-cliente");


    if (!nome || !email || !telefone) {

        return false;
    }


    if (nome.value.trim() === "") {

        alert("Por favor, informe seu nome.");

        nome.focus();

        return false;
    }


    if (email.value.trim() === "") {

        alert("Por favor, informe seu e-mail.");

        email.focus();

        return false;
    }


    if (!email.value.includes("@")) {

        alert("Por favor, informe um e-mail válido.");

        email.focus();

        return false;
    }


    if (telefone.value.trim() === "") {

        alert("Por favor, informe seu telefone.");

        telefone.focus();

        return false;
    }


    return true;
}
// ======================================================
// VALIDAÇÃO DO ENDEREÇO
// ======================================================

function validarEndereco() {

    const cep =
        document.getElementById("cep");

    const endereco =
        document.getElementById("endereco");

    const numero =
        document.getElementById("numero");

    const bairro =
        document.getElementById("bairro");

    const cidade =
        document.getElementById("cidade");

    const estado =
        document.getElementById("estado");


    if (!cep || !endereco || !numero || !bairro || !cidade || !estado) {

        return false;
    }


    if (cep.value.trim() === "") {

        alert("Por favor, informe o CEP.");

        cep.focus();

        return false;
    }


    if (endereco.value.trim() === "") {

        alert("Por favor, informe o endereço.");

        endereco.focus();

        return false;
    }


    if (numero.value.trim() === "") {

        alert("Por favor, informe o número do endereço.");

        numero.focus();

        return false;
    }


    if (bairro.value.trim() === "") {

        alert("Por favor, informe o bairro.");

        bairro.focus();

        return false;
    }


    if (cidade.value.trim() === "") {

        alert("Por favor, informe a cidade.");

        cidade.focus();

        return false;
    }


    if (estado.value.trim() === "") {

        alert("Por favor, informe o estado.");

        estado.focus();

        return false;
    }


    return true;
}
// ======================================================
// VALIDAÇÃO DA FORMA DE PAGAMENTO
// ======================================================

function validarFormaPagamento() {

    const pagamentoSelecionado =
        document.querySelector('input[name="pagamento"]:checked');


    if (!pagamentoSelecionado) {

        alert("Por favor, selecione uma forma de pagamento.");

        return false;
    }


    return true;
}
configurarBotoesFinalizarPedido();
// ======================================================
// MENU LATERAL MOBILE
// ======================================================

function configurarMenuMobile() {

    const botaoAbrir =
        document.getElementById("btn-menu-mobile");

    const botaoFechar =
        document.getElementById("btn-close-menu");

    const menu =
        document.getElementById("mobile-menu-drawer");

    const fundo =
        document.getElementById("mobile-menu-backdrop");

    const linksMenu =
        document.querySelectorAll(".menu-link");


    // Verifica se os elementos existem
    if (!botaoAbrir || !botaoFechar || !menu || !fundo) {
        return;
    }


    // ==================================================
    // ABRIR MENU
    // ==================================================

    function abrirMenu() {

        menu.classList.remove("-translate-x-full");

        menu.classList.add("translate-x-0");


        fundo.classList.remove(
            "opacity-0",
            "pointer-events-none"
        );

        fundo.classList.add(
            "opacity-100",
            "pointer-events-auto"
        );


        // Impede a página de rolar enquanto o menu está aberto
        document.body.style.overflow = "hidden";
    }


    // ==================================================
    // FECHAR MENU
    // ==================================================

    function fecharMenu() {

        menu.classList.remove("translate-x-0");

        menu.classList.add("-translate-x-full");


        fundo.classList.remove(
            "opacity-100",
            "pointer-events-auto"
        );

        fundo.classList.add(
            "opacity-0",
            "pointer-events-none"
        );


        // Libera novamente a rolagem da página
        document.body.style.overflow = "";
    }


    // ==================================================
    // BOTÃO ☰
    // ==================================================

    botaoAbrir.addEventListener("click", function () {

        abrirMenu();

    });


    // ==================================================
    // BOTÃO X
    // ==================================================

    botaoFechar.addEventListener("click", function () {

        fecharMenu();

    });


    // ==================================================
    // CLICAR FORA DO MENU
    // ==================================================

    fundo.addEventListener("click", function () {

        fecharMenu();

    });


    // ==================================================
    // CLICAR EM UM LINK
    // ==================================================

    linksMenu.forEach(function (link) {

        link.addEventListener("click", function () {

            fecharMenu();

        });

    });


    // ==================================================
    // TECLA ESC
    // ==================================================

    document.addEventListener("keydown", function (evento) {

        if (evento.key === "Escape") {

            fecharMenu();

        }

    });

}
// ======================================================
// BOTÃO MINHA CONTA
// ======================================================

const botaoMinhaConta =
    document.getElementById("btn-minha-conta");

if (botaoMinhaConta) {

    botaoMinhaConta.addEventListener("click", function () {

        window.location.href = "/login";

    });

}
// Inicializa o menu mobile
configurarMenuMobile();

// ======================================================
// MENU PRINCIPAL - ITEM ATIVO
// ======================================================

const linksMenuPrincipal =
    document.querySelectorAll("nav a[href^='#']");

linksMenuPrincipal.forEach(function (link) {

    link.addEventListener("click", function () {

        // Remove a cor ativa de todos os links
        linksMenuPrincipal.forEach(function (outroLink) {

            outroLink.classList.remove(
                "text-primary",
                "font-semibold"
            );

            outroLink.classList.add(
                "text-on-surface-variant"
            );
        });

        // Coloca a cor ativa no link clicado
        link.classList.remove(
            "text-on-surface-variant"
        );

        link.classList.add(
            "text-primary",
            "font-semibold"
        );
    });
});