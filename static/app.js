// ============================================================
// RAPOSA CAÇADORA
// TELEGRAM MINI APP
// ============================================================


let score = 0;
let streak = 0;
let currentUser = null;


// ============================================================
// ELEMENTOS DA PÁGINA
// ============================================================

const playButton = document.getElementById("playButton");
const game = document.getElementById("game");
const ranking = document.getElementById("ranking");
const result = document.getElementById("result");
const debug = document.getElementById("debug");


// ============================================================
// TELEGRAM
// ============================================================

const telegram = window.Telegram?.WebApp;


// ============================================================
// INICIAR TELEGRAM
// ============================================================

if (!telegram) {

    debug.textContent =
        "❌ Telegram WebApp não encontrado. Abra o game pelo Telegram.";

} else {

    telegram.ready();

    telegram.expand();

    console.log("Telegram WebApp encontrado.");
    console.log("initData:", telegram.initData);
    console.log(
        "Usuário:",
        telegram.initDataUnsafe?.user
    );

}


// ============================================================
// AUTENTICAR USUÁRIO
// ============================================================

async function authenticateUser() {

    if (!telegram) {

        debug.textContent =
            "❌ Abra o game pelo Telegram.";

        return;
    }


    const initData = telegram.initData;


    // --------------------------------------------------------
    // VERIFICAR INIT DATA
    // --------------------------------------------------------

    if (!initData) {

        debug.textContent =
            "❌ O Telegram não enviou os dados do usuário.";

        console.error(
            "initData está vazio."
        );

        return;
    }


    debug.textContent =
        "🔄 Conectando ao servidor...";


    try {

        // ----------------------------------------------------
        // ENVIAR DADOS PARA O BACKEND
        // ----------------------------------------------------

        const response = await fetch(
            "/api/auth",
            {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    initData: initData

                })

            }
        );


        // ----------------------------------------------------
        // LER RESPOSTA
        // ----------------------------------------------------

        const data = await response.json();


        console.log(
            "Resposta do servidor:",
            data
        );


        // ----------------------------------------------------
        // ERRO
        // ----------------------------------------------------

        if (!data.success) {

            debug.textContent =
                "❌ Erro: " +
                (data.error || "Falha na autenticação.");

            return;
        }


        // ----------------------------------------------------
        // USUÁRIO AUTENTICADO
        // ----------------------------------------------------

        currentUser = data.user;


        console.log(
            "Usuário autenticado:",
            currentUser
        );


        // ----------------------------------------------------
        // ATUALIZAR INTERFACE
        // ----------------------------------------------------

        updateUserInterface();


        debug.textContent =
            "✅ Usuário conectado com sucesso!";


    } catch (error) {

        console.error(
            "Erro na autenticação:",
            error
        );


        debug.textContent =
            "❌ Erro de conexão com o servidor.";

    }

}


// ============================================================
// ATUALIZAR INTERFACE
// ============================================================

function updateUserInterface() {

    if (!currentUser) {
        return;
    }


    // --------------------------------------------------------
    // PONTOS
    // --------------------------------------------------------

    score =
        currentUser.points || 0;


    document.getElementById(
        "score"
    ).textContent = score;


    // --------------------------------------------------------
    // SEQUÊNCIA
    // --------------------------------------------------------

    streak =
        currentUser.streak || 0;


    document.getElementById(
        "streak"
    ).textContent = streak;


    // --------------------------------------------------------
    // NOME
    // --------------------------------------------------------

    const name =
        currentUser.first_name ||
        currentUser.username ||
        "Caçador";


    const subtitle =
        document.querySelector(
            ".subtitle"
        );


    if (subtitle) {

        subtitle.textContent =
            `Olá, ${name}! Encontre a oferta. Acerte o preço. Ganhe pontos.`;

    }

}


// ============================================================
// BOTÃO JOGAR
// ============================================================

playButton.addEventListener(
    "click",
    () => {

        game.classList.remove(
            "hidden"
        );


        ranking.classList.add(
            "hidden"
        );


        game.scrollIntoView({
            behavior: "smooth"
        });

    }
);


// ============================================================
// RESPOSTAS DO JOGO
// ============================================================

document
    .querySelectorAll(".option")
    .forEach(
        (button) => {

            button.addEventListener(
                "click",
                () => {

                    const answer =
                        button.dataset.answer;


                    // ----------------------------------------
                    // DESABILITAR BOTÕES
                    // ----------------------------------------

                    document
                        .querySelectorAll(".option")
                        .forEach(
                            (item) => {

                                item.disabled = true;

                            }
                        );


                    // ----------------------------------------
                    // RESPOSTA CERTA
                    // ----------------------------------------

                    if (answer === "89") {

                        score += 100;

                        streak += 1;


                        result.textContent =
                            "🎉 Acertou! +100 pontos";


                        result.className =
                            "result success";

                    }


                    // ----------------------------------------
                    // RESPOSTA ERRADA
                    // ----------------------------------------

                    else {

                        streak = 0;


                        result.textContent =
                            "❌ Errou! A resposta era R$ 89,90";


                        result.className =
                            "result error";

                    }


                    // ----------------------------------------
                    // ATUALIZAR TELA
                    // ----------------------------------------

                    document.getElementById(
                        "score"
                    ).textContent = score;


                    document.getElementById(
                        "streak"
                    ).textContent = streak;

                }
            );

        }
    );


// ============================================================
// RANKING
// ============================================================

function showRanking() {

    ranking.classList.remove(
        "hidden"
    );


    game.classList.add(
        "hidden"
    );


    ranking.scrollIntoView({
        behavior: "smooth"
    });

}


function closeRanking() {

    ranking.classList.add(
        "hidden"
    );

}


// ============================================================
// INICIAR AUTENTICAÇÃO
// ============================================================

authenticateUser();
