(() => {

    const area = document.getElementById('jogo2Area');
    const canvas = document.getElementById('jogo2Canvas');
    const ctx = canvas.getContext('2d');

    const pontosEl = document.getElementById('jogo2Pontos');
    const recordeEl = document.getElementById('jogo2Recorde');
    const mensagem = document.getElementById('jogo2Mensagem');
    const mensagemTexto = document.getElementById('jogo2MensagemTexto');
    const botao = document.getElementById('jogo2Botao');


    /* ==================================================
       CONFIGURAÇÃO
    ================================================== */

    let largura = 0;
    let altura = 0;
    let dpr = 1;

    const ALTURA_AGUA = 0.52;

    const GRAVIDADE = 0.20;
    const IMPULSO_CURSOR = 0.16;

    const VELOCIDADE_INICIAL = 2.8;
    const VELOCIDADE_MAXIMA = 6.2;


    /* ==================================================
       ESTADO
    ================================================== */

    let jogando = false;
    let terminou = false;

    let pontos = 0;

    let recorde =
        Number(localStorage.getItem('jogo2-recorde')) || 0;

    let velocidade = VELOCIDADE_INICIAL;

    let tempoUltimo = 0;
    let tempoJogo = 0;

    let mouseY = 0;
    let mouseAtivo = false;

    let pedras = [];
    let cabides = [];

    let ultimoNivelAgua = null;

    let tempoSplash = 0;


    /* ==================================================
       ÁUDIO
    ================================================== */

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
            audioContext.state === 'suspended'
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

        if (!audioContext) return;

        const agora =
            audioContext.currentTime;

        const oscilador =
            audioContext.createOscillator();

        const ganho =
            audioContext.createGain();

        oscilador.type = tipo;

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

        oscilador.connect(ganho);
        ganho.connect(audioContext.destination);

        oscilador.start(agora);
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

        setTimeout(() => {

            som(
                990,
                0.09,
                'square',
                0.035
            );

        }, 45);
    }


    function somCabideEspecial() {

        som(
            392,
            0.12,
            'triangle',
            0.05
        );

        setTimeout(() => {

            som(
                523,
                0.14,
                'triangle',
                0.045
            );

        }, 70);

        setTimeout(() => {

            som(
                784,
                0.22,
                'triangle',
                0.04
            );

        }, 145);
    }


    function somSplash() {

        if (!audioContext) return;

        const agora =
            audioContext.currentTime;

        const duracao =
            0.28;

        const buffer =
            audioContext.createBuffer(
                1,
                audioContext.sampleRate * duracao,
                audioContext.sampleRate
            );

        const dados =
            buffer.getChannelData(0);

        for (
            let i = 0;
            i < dados.length;
            i++
        ) {

            const t =
                i / dados.length;

            dados[i] =
                (
                    Math.random() * 2 - 1
                ) *
                Math.pow(
                    1 - t,
                    2.5
                );
        }

        const fonte =
            audioContext.createBufferSource();

        const filtro =
            audioContext.createBiquadFilter();

        const ganho =
            audioContext.createGain();

        filtro.type =
            'lowpass';

        filtro.frequency.value =
            1600;

        ganho.gain.setValueAtTime(
            0.08,
            agora
        );

        ganho.gain.exponentialRampToValueAtTime(
            0.001,
            agora + duracao
        );

        fonte.buffer =
            buffer;

        fonte.connect(filtro);
        filtro.connect(ganho);
        ganho.connect(audioContext.destination);

        fonte.start(agora);
    }


    function somColisao() {

        som(
            100,
            0.28,
            'sawtooth',
            0.08
        );

        setTimeout(() => {

            som(
                65,
                0.35,
                'square',
                0.06
            );

        }, 60);
    }


    function somRecorde() {

        const notas = [
            523,
            659,
            784,
            1046
        ];

        notas.forEach(
            (nota, i) => {

                setTimeout(() => {

                    som(
                        nota,
                        0.18,
                        'square',
                        0.045
                    );

                }, i * 100);

            }
        );
    }


    /* ==================================================
       CANVAS
    ================================================== */

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


    /* ==================================================
       NESSIE
    ================================================== */

    const nessie = {

        x: 150,

        y: 0,

        largura: 55,

        altura: 36,

        velocidadeY: 0,

        rotacao: 0,

        comprimento: 155,

        segmento: 13,

        onda: 0

    };


    function atualizarNessie() {

        const limiteSuperior =
            35;

        const limiteInferior =
            altura - 48;

        const nivelAgua =
            altura * ALTURA_AGUA;

        const estavaNaAgua =
            nessie.y > nivelAgua;


        if (mouseAtivo) {

            const alvo =
                Math.max(
                    limiteSuperior,
                    Math.min(
                        limiteInferior,
                        mouseY - 18
                    )
                );

            const diferenca =
                alvo - nessie.y;

            nessie.velocidadeY +=
                diferenca *
                IMPULSO_CURSOR;

        } else {

            nessie.velocidadeY +=
                GRAVIDADE;
        }


        nessie.velocidadeY *= 0.82;

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

        nessie.onda += 0.06;


        const agoraNaAgua =
            nessie.y > nivelAgua;


        if (
            ultimoNivelAgua !== null &&
            estavaNaAgua !== agoraNaAgua
        ) {

            iniciarAudio();
            somSplash();

            tempoSplash =
                performance.now();
        }


        ultimoNivelAgua =
            agoraNaAgua;
    }


    /* ==================================================
       NESSIE — DESENHO
    ================================================== */

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


        /* corpo serpenteante */

        const segmentos =
            Math.floor(
                nessie.comprimento /
                nessie.segmento
            );


        for (
            let i = segmentos;
            i >= 0;
            i--
        ) {

            const distancia =
                i * nessie.segmento;

            const curva =
                Math.sin(
                    nessie.onda -
                    i * 0.45
                ) * 5;

            const sx =
                -distancia;

            const sy =
                curva +
                i * 0.5;

            const tamanho =
                17 -
                i * 0.018;


            ctx.fillStyle =
                i % 3 === 0
                    ? '#d9bd4c'
                    : '#c9aa3d';


            ctx.fillRect(
                sx,
                sy - tamanho / 2,
                tamanho,
                tamanho
            );
        }


        /* pescoço */

        ctx.fillStyle =
            '#d8ba45';

        ctx.fillRect(
            5,
            -27,
            12,
            30
        );

        ctx.fillRect(
            12,
            -34,
            15,
            16
        );


        /* cabeça */

        ctx.fillRect(
            23,
            -38,
            25,
            18
        );

        ctx.fillRect(
            38,
            -31,
            12,
            9
        );


        /* chifres */

        ctx.fillStyle =
            '#a78d32';

        ctx.fillRect(
            25,
            -45,
            5,
            8
        );

        ctx.fillRect(
            39,
            -45,
            5,
            8
        );


        /* olho */

        ctx.fillStyle =
            '#111';

        ctx.fillRect(
            41,
            -33,
            4,
            4
        );


        /* boca */

        ctx.fillRect(
            47,
            -25,
            7,
            2
        );


        /* cauda */

        ctx.fillStyle =
            '#ad9134';

        ctx.beginPath();

        ctx.moveTo(
            -110,
            5
        );

        ctx.lineTo(
            -133,
            1
        );

        ctx.lineTo(
            -148,
            11
        );

        ctx.lineTo(
            -130,
            17
        );

        ctx.lineTo(
            -108,
            12
        );

        ctx.closePath();

        ctx.fill();


        ctx.restore();
    }


    /* ==================================================
       PEDRAS
    ================================================== */

    function criarPedra(x) {

        const tamanho =
            38 +
            Math.random() * 70;

        const alturaPedra =
            35 +
            Math.random() * 100;

        const y =
            35 +
            Math.random() *
            (
                altura -
                alturaPedra -
                70
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


    function desenharPedra(pedra) {

        const x =
            pedra.x;

        const y =
            pedra.y;

        const w =
            pedra.largura;

        const h =
            pedra.altura;


        /*
        desenho propositalmente plano,
        sem sombra ou volume realista
        */

        ctx.fillStyle =
            '#365b66';


        ctx.beginPath();

        ctx.moveTo(
            x,
            y + h
        );

        ctx.lineTo(
            x + w * 0.08,
            y + h * 0.35
        );

        ctx.lineTo(
            x + w * 0.28,
            y + h * 0.10
        );

        ctx.lineTo(
            x + w * 0.55,
            y
        );

        ctx.lineTo(
            x + w * 0.82,
            y + h * 0.18
        );

        ctx.lineTo(
            x + w,
            y + h * 0.55
        );

        ctx.lineTo(
            x + w * 0.91,
            y + h
        );

        ctx.closePath();

        ctx.fill();


        /*
        riscos abstratos da pedra
        */

        ctx.strokeStyle =
            '#557d82';

        ctx.lineWidth =
            2;

        ctx.globalAlpha =
            0.55;


        for (
            let i = 0;
            i < 3;
            i++
        ) {

            ctx.beginPath();

            ctx.moveTo(
                x + w * 0.2,
                y + h * (
                    0.25 + i * 0.18
                )
            );

            ctx.lineTo(
                x + w * 0.65,
                y + h * (
                    0.18 + i * 0.19
                )
            );

            ctx.stroke();
        }


        ctx.globalAlpha =
            1;
    }


    /* ==================================================
       CABIDES
    ================================================== */

    function criarCabide(x) {

        const y =
            60 +
            Math.random() *
            (
                altura - 120
            );

        const especial =
            Math.random() < 0.12;


        return {

            x,

            y,

            coletado:
                false,

            especial,

            tamanho:
                especial
                    ? 24
                    : 18

        };
    }


    function desenharCamisa(
        x,
        y
    ) {

        ctx.fillStyle =
            '#ffffff';


        ctx.beginPath();

        ctx.moveTo(
            x - 13,
            y + 5
        );

        ctx.lineTo(
            x - 24,
            y + 15
        );

        ctx.lineTo(
            x - 16,
            y + 23
        );

        ctx.lineTo(
            x - 10,
            y + 18
        );

        ctx.lineTo(
            x - 10,
            y + 39
        );

        ctx.lineTo(
            x + 12,
            y + 39
        );

        ctx.lineTo(
            x + 12,
            y + 18
        );

        ctx.lineTo(
            x + 18,
            y + 23
        );

        ctx.lineTo(
            x + 25,
            y + 15
        );

        ctx.lineTo(
            x + 14,
            y + 5
        );

        ctx.closePath();

        ctx.fill();
    }


    function desenharCabide(cabide) {

        if (
            cabide.coletado
        ) return;


        const x =
            cabide.x;

        const y =
            cabide.y;


        /* gancho */

        ctx.strokeStyle =
            '#f2c400';

        ctx.lineWidth =
            5;

        ctx.lineCap =
            'square';


        ctx.beginPath();

        ctx.moveTo(
            x,
            y - 9
        );

        ctx.bezierCurveTo(
            x - 8,
            y - 18,
            x - 5,
            y - 25,
            x + 2,
            y - 25
        );

        ctx.bezierCurveTo(
            x + 8,
            y - 25,
            x + 9,
            y - 18,
            x + 4,
            y - 14
        );

        ctx.stroke();


        /* corpo */

        ctx.beginPath();

        ctx.moveTo(
            x + 2,
            y - 9
        );

        ctx.lineTo(
            x - 22,
            y + 9
        );

        ctx.lineTo(
            x,
            y + 20
        );

        ctx.lineTo(
            x + 22,
            y + 9
        );

        ctx.closePath();

        ctx.stroke();


        if (
            cabide.especial
        ) {

            desenharCamisa(
                x,
                y + 8
            );
        }
    }


    /* ==================================================
       COLISÃO
    ================================================== */

    function colisao(a, b) {

        return (

            a.x <
            b.x + b.largura &&

            a.x + a.largura >
            b.x &&

            a.y <
            b.y + b.altura &&

            a.y + a.altura >
            b.y

        );
    }


    function colisaoPedra() {

        const hitbox = {

            x:
                nessie.x - 22,

            y:
                nessie.y - 28,

            largura:
                60,

            altura:
                48

        };


        for (
            const pedra of pedras
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


    /* ==================================================
       COLETA
    ================================================== */

    function coletarCabides() {

        for (
            const cabide of cabides
        ) {

            if (
                cabide.coletado
            ) continue;


            const dx =
                nessie.x -
                cabide.x;

            const dy =
                nessie.y -
                cabide.y;


            const distancia =
                Math.sqrt(
                    dx * dx +
                    dy * dy
                );


            if (
                distancia < 42
            ) {

                cabide.coletado =
                    true;


                if (
                    cabide.especial
                ) {

                    pontos += 5;

                    somCabideEspecial();

                } else {

                    pontos += 1;

                    somCabide();
                }


                pontosEl.textContent =
                    pontos;
            }
        }
    }


    /* ==================================================
       CRIAÇÃO INICIAL DOS OBSTÁCULOS
    ================================================== */

    function criarObstaculos() {

        pedras = [];
        cabides = [];


        let x =
            largura + 180;


        /*
        cria uma sequência inicial
        suficientemente espaçada para
        que o jogador tenha tempo de entrar
        */

        for (
            let i = 0;
            i < 4;
            i++
        ) {

            const pedra =
                criarPedra(x);

            pedras.push(
                pedra
            );


            cabides.push(
                criarCabide(
                    x +
                    pedra.largura +
                    80 +
                    Math.random() * 80
                )
            );


            x +=
                360 +
                Math.random() * 180;
        }
    }


    /* ==================================================
       MOVIMENTO DO MUNDO
    ================================================== */

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
            largura - 260
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
                    : largura + 200;


            const novaPedra =
                criarPedra(x);


            pedras.push(
                novaPedra
            );


            cabides.push(
                criarCabide(
                    x +
                    novaPedra.largura +
                    90 +
                    Math.random() * 100
                )
            );
        }
    }


    /* ==================================================
       DIFICULDADE
    ================================================== */

    function atualizarDificuldade() {

        velocidade =
            Math.min(
                VELOCIDADE_MAXIMA,
                VELOCIDADE_INICIAL +
                tempoJogo * 0.045
            );
    }


    /* ==================================================
       CORES
    ================================================== */

    function corVariavel(
        t,
        deslocamento
    ) {

        const r =
            Math.sin(
                t * 0.00035 +
                deslocamento
            );

        const g =
            Math.sin(
                t * 0.00022 +
                deslocamento * 2
            );

        const b =
            Math.sin(
                t * 0.00028 +
                deslocamento * 3
            );


        const azul =
            105 + r * 35;

        const verde =
            115 + g * 35;

        const dourado =
            Math.max(
                0,
                b
            ) * 25;


        return [
            Math.max(
                0,
                Math.min(
                    255,
                    azul
                )
            ),

            Math.max(
                0,
                Math.min(
                    255,
                    verde +
                    dourado
                )
            ),

            Math.max(
                0,
                Math.min(
                    255,
                    160 +
                    b * 55
                )
            )
        ];
    }


    function rgb(
        valores
    ) {

        return `rgb(
            ${Math.round(valores[0])},
            ${Math.round(valores[1])},
            ${Math.round(valores[2])}
        )`;
    }


    /* ==================================================
       RISCOS DO CÉU
    ================================================== */

    function desenharRiscosCeu(
        tempo
    ) {

        ctx.save();

        ctx.globalAlpha =
            0.28;

        ctx.lineWidth =
            1;


        const quantidade =
            Math.floor(
                largura / 13
            );


        for (
            let i = 0;
            i < quantidade;
            i++
        ) {

            const x =
                i * 13;


            const deslocamento =
                Math.sin(
                    i * 1.73 +
                    tempo * 0.0007
                ) * 25;


            const y =
                30 +
                (
                    i * 37
                ) %
                (
                    altura *
                    ALTURA_AGUA -
                    50
                );


            const chuva =
                Math.sin(
                    tempo * 0.00018 +
                    i * 0.9
                ) > 0.76;


            ctx.strokeStyle =
                chuva
                    ? '#d9e5e3'
                    : '#6d99b0';


            ctx.beginPath();


            if (chuva) {

                ctx.moveTo(
                    x + deslocamento,
                    y
                );

                ctx.lineTo(
                    x +
                    deslocamento -
                    8,
                    y + 40
                );

            } else {

                ctx.moveTo(
                    x + deslocamento,
                    y
                );

                ctx.lineTo(
                    x +
                    deslocamento +
                    28,
                    y - 4
                );
            }


            ctx.stroke();
        }


        ctx.restore();
    }


    /* ==================================================
       ÁGUA
    ================================================== */

    function desenharAgua(
        tempo
    ) {

        const inicio =
            altura * ALTURA_AGUA;


        ctx.save();


        for (
            let camada = 0;
            camada < 13;
            camada++
        ) {

            const y =
                inicio +
                camada * 31;


            const cor =
                corVariavel(
                    tempo +
                    camada * 1000,
                    camada
                );


            ctx.strokeStyle =
                rgb(cor);

            ctx.globalAlpha =
                0.55;

            ctx.lineWidth =
                2;


            ctx.beginPath();


            for (
                let x = -40;
                x < largura + 50;
                x += 15
            ) {

                const onda =
                    Math.sin(
                        x * 0.028 +
                        tempo * 0.001 +
                        camada
                    ) * 8;


                const onda2 =
                    Math.sin(
                        x * 0.011 -
                        tempo * 0.0006
                    ) * 12;


                const yy =
                    y +
                    onda +
                    onda2;


                if (
                    x === -40
                ) {

                    ctx.moveTo(
                        x,
                        yy
                    );

                } else {

                    ctx.lineTo(
                        x,
                        yy
                    );
                }
            }


            ctx.stroke();
        }


        ctx.restore();
    }


    /* ==================================================
       CENÁRIO
    ================================================== */

    function desenharCenario(
        tempo
    ) {

        const nivel =
            altura * ALTURA_AGUA;


        const ceu =
            corVariavel(
                tempo,
                1
            );


        ctx.fillStyle =
            rgb([
                ceu[0] + 40,
                ceu[1] + 40,
                ceu[2] + 45
            ]);


        ctx.fillRect(
            0,
            0,
            largura,
            nivel + 5
        );


        const agua =
            corVariavel(
                tempo,
                8
            );


        ctx.fillStyle =
            rgb([
                agua[0] - 10,
                agua[1] - 5,
                agua[2]
            ]);


        ctx.fillRect(
            0,
            nivel,
            largura,
            altura
        );


        desenharRiscosCeu(
            tempo
        );


        desenharAgua(
            tempo
        );


        /* superfície */

        ctx.strokeStyle =
            '#719a9c';

        ctx.globalAlpha =
            0.8;

        ctx.lineWidth =
            2;


        ctx.beginPath();


        for (
            let x = -20;
            x < largura + 30;
            x += 14
        ) {

            const y =
                nivel +
                Math.sin(
                    x * 0.035 +
                    tempo * 0.001
                ) * 6;


            if (
                x === -20
            ) {

                ctx.moveTo(
                    x,
                    y
                );

            } else {

                ctx.lineTo(
                    x,
                    y
                );
            }
        }


        ctx.stroke();

        ctx.globalAlpha = 1;


        /* splash */

        if (
            performance.now() -
            tempoSplash <
            350
        ) {

            const progresso =
                (
                    performance.now() -
                    tempoSplash
                ) / 350;


            const raio =
                12 +
                progresso * 35;


            ctx.strokeStyle =
                'rgba(230,245,240,' +
                (1 - progresso) +
                ')';


            ctx.lineWidth = 2;


            ctx.beginPath();


            ctx.ellipse(
                nessie.x,
                nivel,
                raio,
                raio * 0.28,
                0,
                0,
                Math.PI * 2
            );


            ctx.stroke();
        }
    }


    /* ==================================================
       DESENHO
    ================================================== */

    function desenhar(
        tempo
    ) {

        ctx.clearRect(
            0,
            0,
            largura,
            altura
        );


        desenharCenario(
            tempo
        );


        pedras.forEach(
            desenharPedra
        );


        cabides.forEach(
            desenharCabide
        );


        desenharNessie();
    }


    /* ==================================================
       INICIAR / REINICIAR
    ================================================== */

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
            altura * 0.25;


        nessie.velocidadeY =
            0;


        ultimoNivelAgua =
            nessie.y >
            altura * ALTURA_AGUA;


        criarObstaculos();


        /*
        O botão deixa de participar
        da interface do jogo.
        */

        if (botao) {

            botao.style.display =
                'none';
        }


        if (mensagem) {

            mensagem.classList.remove(
                'visivel'
            );
        }


        tempoUltimo =
            performance.now();
    }


    /* ==================================================
       FIM
    ================================================== */

    function fim() {

        if (
            terminou
        ) return;


        jogando =
            false;

        terminou =
            true;


        iniciarAudio();
        somColisao();


        const novoRecorde =
            pontos > recorde;


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


            if (mensagemTexto) {

                mensagemTexto.innerHTML =
                    'você bateu o recorde.<br>' +
                    'o lago ainda é seu.';
            }

        } else {

            if (mensagemTexto) {

                mensagemTexto.innerHTML =
                    'o monstro bateu.<br>' +
                    'cabides devorados: ' +
                    pontos;
            }
        }


        if (recordeEl) {

            recordeEl.textContent =
                'recorde ' +
                recorde;
        }


        /*
        Não há botão.
        A mensagem serve apenas
        como indicação visual.
        */

        if (mensagem) {

            mensagem.classList.add(
                'visivel'
            );
        }
    }


    /* ==================================================
       LOOP
    ================================================== */

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


    /* ==================================================
       CONTROLE DO CURSOR
    ================================================== */

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


    /* ==================================================
       CLIQUE
       
       PRIMEIRO CLIQUE:
       inicia.

       CLIQUE APÓS COLISÃO:
       reinicia.

       DURANTE O JOGO:
       não faz nada.
    ================================================== */

    area.addEventListener(
        'click',
        event => {

            event.preventDefault();


            if (
                !jogando
            ) {

                iniciar();
            }
        }
    );


    /* ==================================================
       REDIMENSIONAMENTO
    ================================================== */

    window.addEventListener(
        'resize',
        () => {

            tamanhoCanvas();

        }
    );


    /* ==================================================
       INICIALIZAÇÃO
    ================================================== */

    tamanhoCanvas();


    if (recordeEl) {

        recordeEl.textContent =
            'recorde ' +
            recorde;
    }


    /*
    Garante que a mensagem inicial
    não impeça o clique.
    */

    if (mensagem) {

        mensagem.classList.add(
            'visivel'
        );
    }


    /*
    O botão antigo não é mais utilizado.
    */

    if (botao) {

        botao.style.display =
            'none';

    }


    /*
    O jogo começa parado.
    O primeiro clique inicia.
    */

    jogando =
        false;

    terminou =
        false;


    tempoUltimo =
        performance.now();


    requestAnimationFrame(
        animar
    );

})();
