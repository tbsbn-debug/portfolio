(() => {

    const area =
        document.getElementById(
            'jogo2Area'
        );

    const canvas =
        document.getElementById(
            'jogo2Canvas'
        );

    const ctx =
        canvas.getContext('2d');


    const pontosEl =
        document.getElementById(
            'jogo2Pontos'
        );

    const recordeEl =
        document.getElementById(
            'jogo2Recorde'
        );

    const mensagem =
        document.getElementById(
            'jogo2Mensagem'
        );

    const mensagemTexto =
        document.getElementById(
            'jogo2MensagemTexto'
        );

    const botao =
        document.getElementById(
            'jogo2Botao'
        );


    /*
    ==================================================
    CONFIGURAÇÃO
    ==================================================
    */

    let largura = 0;
    let altura = 0;
    let dpr = 1;

    const ALTURA_AGUA = 0.48;

    const GRAVIDADE = 0.32;

    const IMPULSO_CURSOR = 0.18;

    const VELOCIDADE_INICIAL = 2.8;

    const VELOCIDADE_MAXIMA = 6.2;


    /*
    ==================================================
    ESTADO
    ==================================================
    */

    let jogando = false;
    let terminou = false;

    let pontos = 0;

    let recorde =
        Number(
            localStorage.getItem(
                'jogo2-recorde'
            )
        ) || 0;


    let velocidade =
        VELOCIDADE_INICIAL;


    let tempoUltimo = 0;

    let tempoJogo = 0;


    let mouseY = 0;

    let mouseAtivo = false;


    let pedras = [];

    let cabides = [];


    /*
    ==================================================
    ÁUDIO
    ==================================================
    */

    let audioContext = null;


    function iniciarAudio() {

        if (!audioContext) {

            audioContext =
                new (
                    window.AudioContext ||
                    window.webkitAudioContext
                )();

        }


        if (
            audioContext.state ===
            'suspended'
        ) {

            audioContext.resume();

        }

    }


    function som(
        frequencia,
        duracao,
        tipo = 'square',
        volume = 0.04
    ) {

        if (!audioContext) {
            return;
        }


        const agora =
            audioContext.currentTime;


        const oscilador =
            audioContext.createOscillator();


        const ganho =
            audioContext.createGain();


        oscilador.type =
            tipo;


        oscilador.frequency.setValueAtTime(
            frequencia,
            agora
        );


        ganho.gain.setValueAtTime(
            volume,
            agora
        );


        ganho.gain.exponentialRampToValueAtTime(
            0.001,
            agora + duracao
        );


        oscilador.connect(
            ganho
        );

        ganho.connect(
            audioContext.destination
        );


        oscilador.start(
            agora
        );


        oscilador.stop(
            agora + duracao
        );

    }


    function somCabide() {

        som(
            660,
            0.07,
            'square',
            0.045
        );


        setTimeout(
            () => {

                som(
                    990,
                    0.09,
                    'square',
                    0.035
                );

            },
            45
        );

    }


    function somColisao() {

        som(
            100,
            0.28,
            'sawtooth',
            0.08
        );


        setTimeout(
            () => {

                som(
                    65,
                    0.35,
                    'square',
                    0.06
                );

            },
            60
        );

    }


    function somRecorde() {

        const notas = [
            523,
            659,
            784,
            1046
        ];


        notas.forEach(
            (
                nota,
                i
            ) => {

                setTimeout(
                    () => {

                        som(
                            nota,
                            0.18,
                            'square',
                            0.045
                        );

                    },
                    i * 100
                );

            }
        );

    }


    /*
    ==================================================
    CANVAS
    ==================================================
    */

    function tamanhoCanvas() {

        const rect =
            area.getBoundingClientRect();


        largura =
            rect.width;

        altura =
            rect.height;


        dpr =
            Math.min(
                window.devicePixelRatio || 1,
                2
            );


        canvas.width =
            Math.round(
                largura * dpr
            );


        canvas.height =
            Math.round(
                altura * dpr
            );


        canvas.style.width =
            largura + 'px';


        canvas.style.height =
            altura + 'px';


        ctx.setTransform(
            dpr,
            0,
            0,
            dpr,
            0,
            0
        );

    }


    /*
    ==================================================
    MONSTRO
    ==================================================
    */

    const nessie = {

        x: 150,

        y: 0,

        largura: 42,

        altura: 34,

        velocidadeY: 0,

        rotacao: 0

    };


    function atualizarNessie() {

        const limiteSuperior =
            55;


        const limiteInferior =
            altura *
            ALTURA_AGUA -
            42;


        if (
            mouseAtivo
        ) {

            const alvo =
                Math.max(
                    limiteSuperior,
                    Math.min(
                        limiteInferior,
                        mouseY - 18
                    )
                );


            const diferenca =
                alvo -
                nessie.y;


            nessie.velocidadeY +=
                diferenca *
                IMPULSO_CURSOR;

        } else {

            nessie.velocidadeY +=
                GRAVIDADE;

        }


        nessie.velocidadeY *=
            0.78;


        nessie.y +=
            nessie.velocidadeY;


        if (
            nessie.y <
            limiteSuperior
        ) {

            nessie.y =
                limiteSuperior;

            nessie.velocidadeY =
                0;

        }


        if (
            nessie.y >
            limiteInferior
        ) {

            nessie.y =
                limiteInferior;

            nessie.velocidadeY =
                0;

        }


        nessie.rotacao =
            nessie.velocidadeY *
            0.018;

    }


    /*
    ==================================================
    PIXEL ART — NESSIE
    ==================================================
    */

    function desenharNessie() {

        const x =
            nessie.x;

        const y =
            nessie.y;


        ctx.save();


        ctx.translate(
            x,
            y
        );


        ctx.rotate(
            nessie.rotacao
        );


        /*
        CORPO
        */

        ctx.fillStyle =
            '#d6b84c';


        ctx.fillRect(
            -17,
            -8,
            34,
            18
        );


        /*
        PESCOÇO
        */

        ctx.fillRect(
            7,
            -21,
            10,
            20
        );


        ctx.fillRect(
            12,
            -27,
            13,
            10
        );


        /*
        CABEÇA
        */

        ctx.fillRect(
            19,
            -29,
            18,
            14
        );


        ctx.fillRect(
            30,
            -24,
            9,
            7
        );


        /*
        ORELHAS / CHIFRES
        */

        ctx.fillStyle =
            '#b49a38';


        ctx.fillRect(
            21,
            -34,
            5,
            7
        );


        ctx.fillRect(
            31,
            -34,
            5,
            7
        );


        /*
        OLHO
        */

        ctx.fillStyle =
            '#111111';


        ctx.fillRect(
            31,
            -25,
            3,
            3
        );


        /*
        BOCA
        */

        ctx.fillRect(
            35,
            -19,
            5,
            2
        );


        /*
        PESCOÇO MAIS LONGO
        */

        ctx.fillStyle =
            '#c4a83f';


        ctx.fillRect(
            8,
            -17,
            6,
            13
        );


        /*
        CAUDA — SEMPRE ABAIXO DA ÁGUA
        */

        ctx.fillStyle =
            '#aa9136';


        ctx.beginPath();


        ctx.moveTo(
            -12,
            7
        );


        ctx.lineTo(
            -35,
            15
        );


        ctx.lineTo(
            -52,
            11
        );


        ctx.lineTo(
            -66,
            19
        );


        ctx.lineTo(
            -50,
            23
        );


        ctx.lineTo(
            -31,
            20
        );


        ctx.lineTo(
            -8,
            13
        );


        ctx.closePath();


        ctx.fill();


        ctx.restore();

    }


    /*
    ==================================================
    PEDRAS
    ==================================================
    */

    function criarPedra(
        x
    ) {

        const agua =
            altura *
            ALTURA_AGUA;


        const tamanho =
            35 +
            Math.random() *
            65;


        const alturaPedra =
            35 +
            Math.random() *
            85;


        const margem =
            30;


        const y =
            margem +
            Math.random() *
            (
                altura -
                alturaPedra -
                margem * 2
            );


        return {

            x,

            y,

            largura:
                tamanho,

            altura:
                alturaPedra

        };

    }


    /*
    ==================================================
    CABIDES
    ==================================================
    */

    function criarCabide(
        x
    ) {

        const agua =
            altura *
            ALTURA_AGUA;


        const y =
            70 +
            Math.random() *
            (
                agua -
                120
            );


        return {

            x,

            y,

            coletado:
                false,

            tamanho:
                17

        };

    }


    /*
    ==================================================
    CRIA OBSTÁCULOS
    ==================================================
    */

    function criarObstaculos() {

        pedras =
            [];

        cabides =
            [];


        let x =
            largura +
            100;


        const quantidade =
            7 +
            Math.floor(
                tempoJogo / 8
            );


        for (
            let i = 0;
            i < quantidade;
            i++
        ) {

            x +=
                240 +
                Math.random() *
                160;


            pedras.push(
                criarPedra(
                    x
                )
            );


            if (
                Math.random() <
                0.82
            ) {

                cabides.push(
                    criarCabide(
                        x +
                        80 +
                        Math.random() *
                        130
                    )
                );

            }

        }

    }


    /*
    ==================================================
    DESENHA PEDRAS
    ==================================================
    */

    function desenharPedra(
        pedra
    ) {

        ctx.fillStyle =
            '#68645b';


        ctx.fillRect(
            pedra.x,
            pedra.y,
            pedra.largura,
            pedra.altura
        );


        ctx.fillStyle =
            '#807b70';


        ctx.fillRect(
            pedra.x + 8,
            pedra.y + 5,
            pedra.largura - 16,
            8
        );


        ctx.fillStyle =
            '#55524c';


        ctx.fillRect(
            pedra.x + 5,
            pedra.y + 18,
            10,
            pedra.altura - 23
        );


        ctx.fillRect(
            pedra.x +
            pedra.largura -
            15,
            pedra.y + 18,
            10,
            pedra.altura - 23
        );

    }


    /*
    ==================================================
    DESENHA CABIDE
    ==================================================
    */

    function desenharCabide(
        cabide
    ) {

        if (
            cabide.coletado
        ) {

            return;

        }


        const x =
            cabide.x;

        const y =
            cabide.y;


        ctx.strokeStyle =
            '#b58d22';


        ctx.lineWidth =
            4;


        ctx.beginPath();


        ctx.moveTo(
            x,
            y - 8
        );


        ctx.bezierCurveTo(
            x - 7,
            y - 13,
            x - 7,
            y - 18,
            x,
            y - 18
        );


        ctx.bezierCurveTo(
            x + 7,
            y - 18,
            x + 7,
            y - 13,
            x,
            y - 8
        );


        ctx.lineTo(
            x - 17,
            y + 6
        );


        ctx.lineTo(
            x,
            y + 13
        );


        ctx.lineTo(
            x + 17,
            y + 6
        );


        ctx.closePath();


        ctx.stroke();

    }


    /*
    ==================================================
    COLISÃO
    ==================================================
    */

    function colisao(
        a,
        b
    ) {

        return (

            a.x <
            b.x +
            b.largura &&

            a.x +
            a.largura >
            b.x &&

            a.y <
            b.y +
            b.altura &&

            a.y +
            a.altura >
            b.y

        );

    }


    function colisaoPedra() {

        const hitbox = {

            x:
                nessie.x - 15,

            y:
                nessie.y - 23,

            largura:
                42,

            altura:
                42

        };


        for (
            const pedra
            of pedras
        ) {

            if (
                colisao(
                    hitbox,
                    pedra
                )
            ) {

                return true;

            }

        }


        return false;

    }


    /*
    ==================================================
    COLETA
    ==================================================
    */

    function coletarCabides() {

        const nx =
            nessie.x;

        const ny =
            nessie.y;


        for (
            const cabide
            of cabides
        ) {

            if (
                cabide.coletado
            ) {

                continue;

            }


            const dx =
                nx -
                cabide.x;


            const dy =
                ny -
                cabide.y;


            const distancia =
                Math.sqrt(
                    dx * dx +
                    dy * dy
                );


            if (
                distancia <
                35
            ) {

                cabide.coletado =
                    true;


                pontos++;


                pontosEl.textContent =
                    pontos;


                somCabide();

            }

        }

    }


    /*
    ==================================================
    MOVER MUNDO
    ==================================================
    */

    function moverMundo() {

        pedras.forEach(
            pedra => {

                pedra.x -=
                    velocidade;

            }
        );


        cabides.forEach(
            cabide => {

                cabide.x -=
                    velocidade;

            }
        );


        pedras =
            pedras.filter(
                pedra =>
                    pedra.x +
                    pedra.largura >
                    -100
            );


        cabides =
            cabides.filter(
                cabide =>
                    cabide.x >
                    -100
            );


        if (
            pedras.length === 0 ||
            pedras[
                pedras.length - 1
            ].x <
            largura -
            220
        ) {

            const ultima =
                pedras[
                    pedras.length - 1
                ];


            const x =
                ultima
                    ? ultima.x +
                      ultima.largura +
                      280
                    : largura +
                      200;


            pedras.push(
                criarPedra(
                    x
                )
            );


            if (
                Math.random() <
                0.9
            ) {

                cabides.push(
                    criarCabide(
                        x +
                        100 +
                        Math.random() *
                        120
                    )
                );

            }

        }

    }


    /*
    ==================================================
    DIFICULDADE
    ==================================================
    */

    function atualizarDificuldade() {

        velocidade =
            Math.min(
                VELOCIDADE_MAXIMA,
                VELOCIDADE_INICIAL +
                tempoJogo *
                0.045
            );

    }


    /*
    ==================================================
    DESENHO DO LAGO
    ==================================================
    */

    function desenharCenario(
        tempoAtual
    ) {

        /*
        CÉU
        */

        ctx.fillStyle =
            '#f5f0df';


        ctx.fillRect(
            0,
            0,
            largura,
            altura *
            ALTURA_AGUA
        );


        /*
        ÁGUA
        */

        ctx.fillStyle =
            '#9bb4b4';


        ctx.fillRect(
            0,
            altura *
            ALTURA_AGUA,
            largura,
            altura
        );


        /*
        LINHA D'ÁGUA
        */

        ctx.fillStyle =
            '#758f8f';


        ctx.fillRect(
            0,
            altura *
            ALTURA_AGUA - 3,
            largura,
            6
        );


        /*
        ONDAS
        */

        ctx.strokeStyle =
            'rgba(255,255,255,.35)';


        ctx.lineWidth =
            1;


        for (
            let i = 0;
            i < 8;
            i++
        ) {

            const y =
                altura *
                ALTURA_AGUA +
                20 +
                i * 27;


            ctx.beginPath();


            for (
                let x = -30;
                x < largura + 30;
                x += 20
            ) {

                const onda =
                    Math.sin(
                        x * 0.035 +
                        tempoAtual *
                        0.0015 +
                        i
                    ) *
                    3;


                if (
                    x === -30
                ) {

                    ctx.moveTo(
                        x,
                        y + onda
                    );

                } else {

                    ctx.lineTo(
                        x,
                        y + onda
                    );

                }

            }


            ctx.stroke();

        }

    }


    /*
    ==================================================
    DESENHO GERAL
    ==================================================
    */

    function desenhar(
        tempoAtual
    ) {

        ctx.clearRect(
            0,
            0,
            largura,
            altura
        );


        desenharCenario(
            tempoAtual
        );


        pedras.forEach(
            desenharPedra
        );


        cabides.forEach(
            desenharCabide
        );


        desenharNessie();

    }


    /*
    ==================================================
    COMEÇAR
    ==================================================
    */

    function iniciar() {

        iniciarAudio();


        jogando =
            true;


        terminou =
            false;


        pontos =
            0;


        pontosEl.textContent =
            '0';


        tempoJogo =
            0;


        velocidade =
            VELOCIDADE_INICIAL;


        nessie.x =
            150;


        nessie.y =
            altura *
            0.25;


        nessie.velocidadeY =
            0;


        criarObstaculos();


        mensagem.classList.remove(
            'visivel'
        );


        botao.style.display =
            'none';


        tempoUltimo =
            performance.now();

    }


    /*
    ==================================================
    FIM
    ==================================================
    */

    function fim() {

        if (
            terminou
        ) {

            return;

        }


        jogando =
            false;


        terminou =
            true;


        somColisao();


        const novoRecorde =
            pontos >
            recorde;


        if (
            novoRecorde
        ) {

            recorde =
                pontos;


            localStorage.setItem(
                'jogo2-recorde',
                recorde
            );


            somRecorde();


            mensagemTexto.innerHTML =
                'você bateu o recorde.<br>' +
                'o lago ainda é seu.';

        } else {

            mensagemTexto.innerHTML =
                'o monstro bateu.<br>' +
                'cabides devorados: ' +
                pontos;

        }


        recordeEl.textContent =
            'recorde ' +
            recorde;


        botao.textContent =
            'começar novamente';


        botao.style.display =
            'inline-block';


        mensagem.classList.add(
            'visivel'
        );

    }


    /*
    ==================================================
    LOOP
    ==================================================
    */

    function animar(
        agora
    ) {

        const delta =
            Math.min(
                0.033,
                (
                    agora -
                    tempoUltimo
                ) / 1000
            );


        tempoUltimo =
            agora;


        if (
            jogando
        ) {

            tempoJogo +=
                delta;


            atualizarNessie();

            moverMundo();

            coletarCabides();

            atualizarDificuldade();


            if (
                colisaoPedra()
            ) {

                fim();

            }

        }


        desenhar(
            agora
        );


        requestAnimationFrame(
            animar
        );

    }


    /*
    ==================================================
    CONTROLE PELO CURSOR
    ==================================================
    */

    area.addEventListener(
        'mousemove',
        event => {

            const rect =
                area.getBoundingClientRect();


            mouseY =
                event.clientY -
                rect.top;


            mouseAtivo =
                true;

        }
    );


    area.addEventListener(
        'mouseleave',
        () => {

            mouseAtivo =
                false;

        }
    );


    /*
    ==================================================
    CLIQUE
    ==================================================
    */

    botao.addEventListener(
        'click',
        event => {

            event.preventDefault();

            iniciar();

        }
    );


    /*
    ==================================================
    TOQUE / CLIQUE NO JOGO
    ==================================================
    */

    area.addEventListener(
        'click',
        () => {

            if (
                !jogando
            ) {

                iniciar();

            }

        }
    );


    /*
    ==================================================
    REDIMENSIONAMENTO
    ==================================================
    */

    window.addEventListener(
        'resize',
        () => {

            tamanhoCanvas();

        }
    );


    /*
    ==================================================
    ESTADO INICIAL
    ==================================================
    */

    tamanhoCanvas();


    recordeEl.textContent =
        'recorde ' +
        recorde;


    mensagem.classList.add(
        'visivel'
    );


    requestAnimationFrame(
        animar
    );

})();
