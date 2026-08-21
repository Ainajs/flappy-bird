const canvas = document.getElementById("jogo"); // Pegando o Canvas do HTML
const ctx = canvas.getContext("2d"); // Pegando o contexto do canvas para desenhar

// Procura no HTML o elemento que possui id="jogo"
const jogo = document.getElementById("jogo"); // Procura no HTML o elemento que possui id="jogo"

// Configurações do Pássaro //
let passaroX = 80; // Posição horizontal do pássaro
let passaroY = 200; // Posição vertical inicial do pássaro
let tamanhoPassaro = 20; // Tamanho do pássaro
let velocidadePassaro = 0; // Começa sem subir nem cair
let gravidade = 0.12; // Faz o pássaro acelerar suavemente durante a queda
let pulo = -5; // Produz um pulo mais leve e controlado
let velocidadeMaximaQueda = 3.5; // Impede que o pássaro fique pesado demais ao cair

// Configurações dos Canos //
let canoX = 400; // Posição horizontal inicial do cano
let larguraCano = 50; // Largura do cano
let alturaCano = 200; // Altura do cano
let espacoCano = 150; // Espaço entre os canos superior e inferior
let velocidadeCano = 1.8; // Move os canos lentamente pela tela

// Pontuação //
let pontuacao = 0; // Inicializa a pontuação
let marcouPonto = false; // Variável para verificar se o ponto já foi marcado

// Moedas //
let moedas = 0; // Guarda a quantidade de moedas coletadas
let moedaColetada = false; // Impede que a mesma moeda seja coletada mais de uma vez
let raioMoeda = 10; // Define o tamanho da moeda e ajuda a calcular a colisão

// gamer over //
let gameOver = false; // Variável para verificar se o jogo acabou
let somGameOverTocou = false; // Impede que o som de game over seja repetido

// Sistema de áudio //
let contextoAudio; // Armazena o sistema de áudio criado pelo navegador
let trilhaIniciada = false; // Controla se a música de fundo já começou
let intervaloTrilha; // Guarda o intervalo responsável por repetir a música
let notaAtual = 0; // Indica qual nota da melodia deve tocar

function iniciarAudio() {
    // Cria o sistema de áudio somente na primeira interação do jogador
    if (!contextoAudio) {
        contextoAudio = new (window.AudioContext || window.webkitAudioContext)();
    }

    // Libera o áudio caso o navegador o tenha deixado suspenso
    if (contextoAudio.state === "suspended") {
        contextoAudio.resume();
    }

    // Inicia a trilha apenas uma vez
    if (!trilhaIniciada) {
        iniciarTrilhaDoJogo();
    }
}

function tocarNota(frequencia, duracao, tipo = "sine", volume = 0.08, atraso = 0) {
    if (!contextoAudio) return; // Não tenta tocar antes da criação do áudio

    let inicio = contextoAudio.currentTime + atraso; // Calcula quando a nota começa
    let oscilador = contextoAudio.createOscillator(); // Gera a onda sonora da nota
    let controleVolume = contextoAudio.createGain(); // Controla o volume da nota

    oscilador.type = tipo; // Escolhe o formato da onda sonora
    oscilador.frequency.setValueAtTime(frequencia, inicio); // Define a altura da nota
    controleVolume.gain.setValueAtTime(volume, inicio); // Define o volume inicial
    controleVolume.gain.exponentialRampToValueAtTime(0.001, inicio + duracao); // Abaixa o volume suavemente

    oscilador.connect(controleVolume); // Envia o som para o controle de volume
    controleVolume.connect(contextoAudio.destination); // Envia o som aos alto-falantes
    oscilador.start(inicio); // Inicia a nota no momento calculado
    oscilador.stop(inicio + duracao); // Encerra a nota após sua duração
}

function iniciarTrilhaDoJogo() {
    trilhaIniciada = true; // Registra que a música já foi iniciada
    const melodia = [392, 0, 523, 440, 0, 587, 523, 440]; // Frequências usadas na música; zero representa pausa

    // Repete as notas da melodia em intervalos regulares
    intervaloTrilha = setInterval(function () {
        if (!gameOver) {
            let frequencia = melodia[notaAtual]; // Seleciona a nota atual
            if (frequencia > 0) {
                tocarNota(frequencia, 0.18, "triangle", 0.025); // Toca a nota quando não for uma pausa
            }
            notaAtual = (notaAtual + 1) % melodia.length; // Avança e retorna ao início no final
        }
    }, 230);
}

function tocarSomDoPulo() {
    // Combina duas notas curtas para criar o efeito de pulo
    tocarNota(420, 0.1, "square", 0.04);
    tocarNota(620, 0.12, "square", 0.035, 0.07);
}

function tocarSomDoPonto() {
    // Combina duas notas crescentes para indicar um ponto
    tocarNota(660, 0.12, "sine", 0.07);
    tocarNota(880, 0.18, "sine", 0.07, 0.1);
}

function tocarSomDaMoeda() {
    // Cria um efeito agudo ao coletar uma moeda
    tocarNota(900, 0.08, "sine", 0.06);
    tocarNota(1200, 0.14, "sine", 0.06, 0.06);
}

function tocarSomDeGameOver() {
    // Toca notas descendentes e interrompe a música de fundo
    tocarNota(330, 0.25, "sawtooth", 0.06);
    tocarNota(220, 0.3, "sawtooth", 0.06, 0.2);
    tocarNota(110, 0.5, "sawtooth", 0.07, 0.45);
    clearInterval(intervaloTrilha); // Para a repetição da trilha
}

// Desenhar o passaro //
function desenharPassaro() {
    // Corpo oval
    ctx.fillStyle = "#ffd93d";
    ctx.beginPath();
    ctx.ellipse(
        passaroX + tamanhoPassaro / 2,
        passaroY + tamanhoPassaro / 2,
        tamanhoPassaro / 2,
        tamanhoPassaro / 2.4,
        0,
        0,
        Math.PI * 2
    );
    ctx.fill();

    // Asa
    ctx.fillStyle = "#f4a261"; // Escolhe a cor da asa
    ctx.beginPath();
    ctx.ellipse(passaroX + 7, passaroY + 13, 6, 4, -0.4, 0, Math.PI * 2); // Desenha a asa oval e inclinada
    ctx.fill();

    // Olho e pupila
    ctx.fillStyle = "white"; // Escolhe a cor do olho
    ctx.beginPath();
    ctx.arc(passaroX + 14, passaroY + 6, 4, 0, Math.PI * 2); // Desenha o olho
    ctx.fill();

    ctx.fillStyle = "black"; // Escolhe a cor da pupila
    ctx.beginPath();
    ctx.arc(passaroX + 15, passaroY + 6, 1.5, 0, Math.PI * 2); // Desenha a pupila
    ctx.fill();

    // Bico
    ctx.fillStyle = "#f77f00"; // Escolhe a cor laranja do bico
    ctx.beginPath();
    ctx.moveTo(passaroX + 17, passaroY + 10); // Define o primeiro ponto do bico
    ctx.lineTo(passaroX + 24, passaroY + 13); // Liga ao ponto da frente
    ctx.lineTo(passaroX + 17, passaroY + 15); // Liga ao ponto inferior
    ctx.closePath(); // Fecha o triângulo
    ctx.fill();
}

// Desenhar uma forma retangular com cantos arredondados //
function desenharRetanguloArredondado(x, y, largura, altura, raio) {
    ctx.beginPath(); // Inicia uma nova forma
    ctx.roundRect(x, y, largura, altura, raio); // Cria o retângulo com cantos arredondados
    ctx.fill(); // Preenche o retângulo com a cor atual
}

// Desenhar os canos //
function desenharCanos() {
    let inicioCanoInferior = alturaCano + espacoCano; // Calcula a posição inicial do cano inferior

    ctx.fillStyle = "#2a9d3f"; // Cor dos canos
    desenharRetanguloArredondado(canoX, -10, larguraCano, alturaCano + 10, 10); // Desenha o cano superior
    desenharRetanguloArredondado(
        canoX,
        inicioCanoInferior,
        larguraCano,
        canvas.height - inicioCanoInferior + 10,
        10
    );

    // Bordas arredondadas nas aberturas dos canos
    ctx.fillStyle = "#36b84d"; // Usa um verde mais claro nas bordas
    desenharRetanguloArredondado(canoX, alturaCano - 14, larguraCano, 14, 6); // Desenha a borda superior
    desenharRetanguloArredondado(canoX, inicioCanoInferior, larguraCano, 14, 6); // Desenha a borda inferior
}

// Desenhar a moeda na passagem do cano //
function desenharMoeda() {
    if (moedaColetada) return; // Não desenha a moeda depois da coleta

    let moedaX = canoX - 60; // Posiciona a moeda antes do cano
    let moedaY = alturaCano + espacoCano / 2; // Centraliza a moeda na abertura

    ctx.fillStyle = "#ffd700"; // Define a cor dourada da moeda
    ctx.strokeStyle = "#d99b00"; // Define a cor da borda
    ctx.lineWidth = 3; // Define a espessura da borda
    ctx.beginPath(); // Inicia o círculo da moeda
    ctx.arc(moedaX, moedaY, raioMoeda, 0, Math.PI * 2); // Desenha a moeda
    ctx.fill(); // Preenche a moeda
    ctx.stroke(); // Desenha a borda

    // Brilho da moeda
    ctx.fillStyle = "#fff3a3"; // Escolhe uma cor clara para o brilho
    ctx.beginPath(); // Inicia o círculo do brilho
    ctx.arc(moedaX - 3, moedaY - 3, 2.5, 0, Math.PI * 2); // Desenha o brilho
    ctx.fill(); // Preenche o brilho
}

// Desenhar a pontuação //

function desenharPontuacao() {
    // Painel organizado para pontos e moedas.
    ctx.fillStyle = "rgba(18, 52, 86, 0.82)";
    ctx.beginPath();
    ctx.roundRect(16, 16, 178, 68, 12);
    ctx.fill();

    ctx.strokeStyle = "rgba(255, 255, 255, 0.65)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = "bold 15px Arial";
    ctx.fillStyle = "#7FDBFF";
    ctx.fillText("PONTOS", 29, 43);
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "right";
    ctx.fillText(pontuacao, 181, 43);

    ctx.fillStyle = "#FFD54A";
    ctx.textAlign = "left";
    ctx.fillText("MOEDAS", 29, 70);
    ctx.fillStyle = "#FFF4B0";
    ctx.textAlign = "right";
    ctx.fillText(moedas, 181, 70);
    ctx.textAlign = "left";
    return;
    ctx.fillStyle = "Yellow"; // Cor do texto da pontuação
    ctx.font = "30px bold Arial"; // Define a fonte e o tamanho do texto
    ctx.fillText("Pontuação: " + pontuacao, 10, 30);

    ctx.fillStyle = "#ffd700"; // Define a cor do contador de moedas
    ctx.font = "22px Arial"; // Define o tamanho e a fonte do contador
    ctx.fillText("Moedas: " + moedas, 10, 58); // Mostra a quantidade coletada
}

// Fazer o pássaro voar //
function voar() {
    document.querySelector("p").classList.add("oculta");
    if (gameOver) { // se o jogo acabou, não permite voar
        return;
    }
    iniciarAudio();
    tocarSomDoPulo();
    velocidadePassaro = pulo; // Aplica a força do pulo na velocidade do pássaro
    }

// Detectar colisão com os canos //
function detectarColisao() { // Colisão com o cano superior
    let inicioCanoInferior = alturaCano + espacoCano; // Onde Começa o cano inferior
    // Verifica se o pássaro está na mesma posição horizontal do cano
    let bateuHorizontalmente = passaroX + tamanhoPassaro > canoX && passaroX < canoX + larguraCano;
    // Verifica se o pássaro bateu no cano superior ou inferior
    let bateuVerticalmente = passaroY < alturaCano || passaroY + tamanhoPassaro > inicioCanoInferior;
    // Se bateu horizontalmente e verticalmente, o jogo acaba
    if (bateuHorizontalmente && bateuVerticalmente) {
        gameOver = true; // Define que o jogo acabou
    }
    // Verifica se o pássaro bateu no chão ou no teto
    if (passaroY + tamanhoPassaro > canvas.height || passaroY < 0) {
        gameOver = true; // Define que o jogo acabou
    }

    if (gameOver && !somGameOverTocou) {
        document.querySelector("p").classList.remove("oculta");
        somGameOverTocou = true;
        tocarSomDeGameOver();
    }
}

// Atualição do Jogo //
function atualizarJogo() {
    if (gameOver) { // Se o jogo acabou, para a atualização
        return;
    }

// Atualiza a posição do pássaro com base na gravidade e na velocidade //
    velocidadePassaro += gravidade;
    velocidadePassaro = Math.min(velocidadePassaro, velocidadeMaximaQueda); // Limita a velocidade da queda
    passaroY += velocidadePassaro;

// Atualiza a posição do cano //
    canoX -= velocidadeCano;

// Verifica se o cano saiu da tela e reseta a posição //
    if (canoX + larguraCano < 0) {
        canoX = canvas.width; // Reseta a posição do cano para a direita da tela
        alturaCano = Math.floor(Math.random() * 250) + 80; // Gera uma nova altura aleatória para o cano
        marcouPonto = false; // Reseta a variável de pontuação
        moedaColetada = false; // Cria uma nova moeda para o próximo cano
    }

// Verifica se o pássaro passou pelo cano para marcar ponto //
    if (passaroX > canoX + larguraCano && !marcouPonto) {
        pontuacao += 100; // Adiciona 100 pontos ao passar por um cano
        marcouPonto = true; // Marca que o ponto já foi contabilizado
        tocarSomDoPonto();
    }

// Verifica se o pássaro encostou na moeda //
    if (!moedaColetada) {
        let moedaX = canoX - 60;
        let moedaY = alturaCano + espacoCano / 2;
        let centroPassaroX = passaroX + tamanhoPassaro / 2;
        let centroPassaroY = passaroY + tamanhoPassaro / 2;
        let distanciaX = centroPassaroX - moedaX;
        let distanciaY = centroPassaroY - moedaY;
        let distancia = Math.sqrt(distanciaX * distanciaX + distanciaY * distanciaY);

        if (distancia < raioMoeda + tamanhoPassaro / 2) {
            moedas++;
            moedaColetada = true;
            tocarSomDaMoeda();
        }
    }
}

// Reiniciar o jogo sem atualizar a página //
function reiniciarJogo() {
    document.querySelector("p").classList.add("oculta");
    passaroY = 200; // Coloca o pássaro novamente na posição inicial
    velocidadePassaro = 0; // Remove a velocidade acumulada da queda
    canoX = canvas.width; // Coloca o cano no lado direito da tela
    alturaCano = 200; // Restaura a altura inicial do cano
    pontuacao = 0; // Zera os pontos da partida anterior
    moedas = 0; // Zera as moedas da partida anterior
    marcouPonto = false; // Libera a pontuação do próximo cano
    moedaColetada = false; // Cria uma moeda para a nova partida
    gameOver = false; // Libera novamente a atualização do jogo
    somGameOverTocou = false; // Permite o som no próximo game over

    // Reinicia a música de fundo, caso o áudio já tenha sido liberado
    if (contextoAudio) {
        clearInterval(intervaloTrilha);
        trilhaIniciada = false;
        notaAtual = 0;
        iniciarTrilhaDoJogo();
    }

    loop(); // Inicia um novo ciclo de animação
}

// Desenhar Game Over //
function desenharGameOver() {
    const centroX = canvas.width / 2;
    const centroY = canvas.height / 2;
    const larguraPainel = Math.min(390, canvas.width - 32);
    const alturaPainel = 300;
    const painelX = centroX - larguraPainel / 2;
    const painelY = centroY - alturaPainel / 2;

    // Escurece o jogo e destaca o resultado da partida.
    ctx.fillStyle = "rgba(7, 20, 38, 0.62)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "rgba(18, 52, 86, 0.96)";
    ctx.beginPath();
    ctx.roundRect(painelX, painelY, larguraPainel, alturaPainel, 24);
    ctx.fill();

    ctx.strokeStyle = "#7FDBFF";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.fillStyle = "#FF5A5F";
    ctx.font = "bold 42px Arial";
    ctx.fillText("GAME OVER", centroX, painelY + 65);

    ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
    ctx.beginPath();
    ctx.roundRect(painelX + 28, painelY + 92, larguraPainel - 56, 108, 15);
    ctx.fill();

    ctx.fillStyle = "#7FDBFF";
    ctx.font = "bold 16px Arial";
    ctx.fillText("PONTUA\u00c7\u00c3O FINAL", centroX, painelY + 122);
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 38px Arial";
    ctx.fillText(pontuacao, centroX, painelY + 165);

    ctx.fillStyle = "#FFD54A";
    ctx.font = "bold 18px Arial";
    ctx.fillText("MOEDAS  " + moedas, centroX, painelY + 190);

    // Configura a aparência da instrução exibida dentro do painel de Game Over.
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 17px Arial";

    // Mostra a instrução original com as asas no lugar das opções antigas de reinício.
    ctx.fillText("\ud83e\udebd  Espa\u00e7o ou clique para voar  \ud83e\udebd", centroX, painelY + 250);
    ctx.textAlign = "left";
    return;
    ctx.fillStyle = "rgba(0, 0, 0, 0.55)"; // Cria um fundo escuro sobre o jogo
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "red"; // Cor do texto de Game Over
    ctx.font = "40px Arial"; // Define a fonte e o tamanho do texto
    ctx.fillText("Game Over", canvas.width / 2 - 105, 280); // Desenha o texto de Game Over no centro da tela
    ctx.fillStyle = "white"; // Cor do texto da pontuação final
    ctx.font = "20px Arial"; // Define a fonte e o tamanho do texto
    ctx.fillText("Pontos: " + pontuacao, canvas.width / 2 - 55, 320); // Mostra a pontuação final
    ctx.fillText("Moedas: " + moedas, canvas.width / 2 - 55, 350); // Mostra as moedas coletadas
    ctx.font = "16px Arial";
    ctx.fillText("Clique ou pressione Espaço para reiniciar", canvas.width / 2 - 150, 395); // Mostra como jogar novamente
}

// Loop Principal do Jogo //
function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Limpa o canvas para redesenhar
atualizarJogo(); // Atualiza a lógica do jogo
desenharPassaro(); // Desenha o pássaro
desenharCanos(); // Desenha os canos
desenharMoeda(); // Desenha a moeda
desenharPontuacao(); // Desenha a pontuação
detectarColisao(); // Verifica colisões

if (gameOver) { // Se o jogo acabou, desenha a tela de Game Over
    desenharGameOver();
    return; // Desenha a tela de Game Over
    }
requestAnimationFrame(loop); // Chama o loop novamente para criar a animação
}

// Controles //
document.addEventListener("keydown", function (event) { // Adiciona um evento de teclado
    if (event.code === "Space") { // Se a tecla pressionada for espaço
        if (gameOver) {
            reiniciarJogo(); // Reinicia quando o jogo tiver acabado
        } else {
            voar(); // Faz o pássaro voar durante a partida
        }
    }
});

// Controles pelo Mouse //
document.addEventListener("click", function () 
{ // Adiciona um evento de clique do mouse
    if (gameOver) {
        reiniciarJogo(); // Reinicia quando o jogo tiver acabado
    } else {
        voar(); // Faz o pássaro voar durante a partida
    }
});


// Começar o Jogo //
loop();

// Mantem o canvas do jogo do tamanho da janela do navegador.
function ajustarCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

ajustarCanvas();
canoX = canvas.width;

window.addEventListener("resize", function () {
    ajustarCanvas();
    canoX = canvas.width;
});
