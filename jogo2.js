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
       CURSOR
    ================================================== */

    /*
    O cursor nativo permanece visível durante todo
    o jogo, inclusive sobre o canvas.
    */

    area.style.cursor = 'default';
    canvas.style.cursor = 'default';


    /* ==================================================
       ÁUDIO
    ================================================== */

    let audioContext = null;

    let ambienteAtivo = false;
    let ambienteOscilador = null;
    let ambienteGanho = null;
    let ambienteFiltro = null;

    let proximaVariacaoAmbiente = 0;


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

        iniciarAmbiente();
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


    /*
    Ruído ambiente muito baixo.

    É construído com ruído filtrado + uma frequência
    grave muito suave, criando uma sensação de água
    sem virar uma trilha sonora evidente.
    */

    function iniciarAmbiente() {

        if (
            ambienteAtivo ||
            !audioContext
        ) return;

        ambienteAtivo = true;

        const agora =
            audioContext.currentTime;


        /* ruído */

        const duracao =
            4;

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

            dados[i] =
                Math.random() * 2 - 1;
        }


        const fonte =
            audioContext.createBufferSource();

        ambienteFiltro =
            audioContext.createBiquadFilter();

        ambienteGanho =
            audioContext.createGain();


        ambienteFiltro.type =
            'lowpass';

        ambienteFiltro.frequency.value =
            430;


        ambienteGanho.gain.value =
            0.012;


        fonte.buffer =
            buffer;

        fonte.loop =
            true;


        fonte.connect(
            ambienteFiltro
        );

        ambienteFiltro.connect(
            ambienteGanho
        );

        ambienteGanho.connect(
            audioContext.destination
        );


        fonte.start(agora);


        /*
        camada grave contínua
        */

        ambienteOscilador =
            audioContext.createOscillator();

        const ganhoGrave =
            audioContext.createGain();


        ambienteOscilador.type =
            'sine';

        ambienteOscilador.frequency.value =
            58;

        ganhoGrave.gain.value =
            0.008;


        ambienteOscilador.connect(
            ganhoGrave
        );

        ganhoGrave.connect(
            audioContext.destination
        );


        ambienteOscilador.start(
            agora
        );


        proximaVariacaoAmbiente =
            performance.now() +
            2500;
    }


    /*
    Pequenas mudanças no ambiente para evitar que
    o ruído fique completamente estático.
    */

    function atualizarAmbiente(tempo) {

        if (
            !ambienteAtivo ||
            !audioContext
        ) return;


        if (
            tempo >
            proximaVariacaoAmbiente
        ) {

            const agora =
                audioContext.currentTime;


            const novaFrequencia =
                350 +
                Math.random() * 180;


            const novoVolume =
                0.008 +
                Math.random() * 0.008;


            ambienteFiltro.frequency
                .linearRampToValueAtTime(
                    novaFrequencia,
                    agora + 1.4
                );


            ambienteGanho.gain
                .linearRampToValueAtTime(
                    novoVolume,
                    agora + 1.4
                );


            if (
                ambienteOscilador
            ) {

                ambienteOscilador.frequency
                    .linearRampToValueAtTime(
                        48 +
                        Math.random() * 25,
                        agora + 1.8
                    );
            }


            proximaVariacaoAmbiente =
                tempo +
                2200 +
                Math.random() * 4000;
        }
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


    /*
    Novo som de entrada/saída da água.

    Em vez de ruído branco agressivo:
    várias frequências graves descendentes,
    com seno e triangle, criando algo mais
    "glub", profundo e elástico.
    */

    function somGlub() {

        if (!audioContext) return;

        const agora =
            audioContext.currentTime;


        const frequenciaInicial =
            170 +
            Math.random() * 35;


        const frequenciaFinal =
            72 +
            Math.random() * 20;


        const oscilador =
            audioContext.createOscillator();

        const ganho =
            audioContext.createGain();

        const filtro =
            audioContext.createBiquadFilter();


        oscilador.type =
            'sine';


        oscilador.frequency.setValueAtTime(
            frequenciaInicial,
            agora
        );


        oscilador.frequency.exponentialRampToValueAtTime(
            frequenciaFinal,
            agora + 0.42
        );


        ganho.gain.setValueAtTime(
            0.0001,
            agora
        );


        ganho.gain.exponentialRampToValueAtTime(
            0.075,
            agora + 0.045
        );


        ganho.gain.exponentialRampToValueAtTime(
            0.001,
            agora + 0.48
        );


        filtro.type =
            'lowpass';

        filtro.frequency.value =
            500;


        oscilador.connect(
            filtro
        );

        filtro.connect(
            ganho
        );

        ganho.connect(
            audioContext.destination
        );


        oscilador.start(
            agora
        );

        oscilador.stop(
            agora + 0.5
        );


        /*
        pequeno segundo corpo do glub
        */

        const oscilador2 =
            audioContext.createOscillator();

        const ganho2 =
            audioContext.createGain();


        oscilador2.type =
            'triangle';

        oscilador2.frequency.setValueAtTime(
            95,
            agora + 0.035
        );

        oscilador2.frequency.exponentialRampToValueAtTime(
            48,
            agora + 0.35
        );


        ganho2.gain.setValueAtTime(
            0.0001,
            agora
        );

        ganho2.gain.exponentialRampToValueAtTime(
            0.035,
            agora + 0.07
        );

        ganho2.gain.exponentialRampToValueAtTime(
            0.001,
            agora + 0.4
        );


        oscilador2.connect(
            ganho2
        );

        ganho2.connect(
            audioContext.destination
        );


        oscilador2.start(
            agora
        );

        oscilador2.stop(
            agora + 0.42
        );
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


        nessie.velocidadeY *=
            0.82;


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


        nessie.onda +=
            0.06;


        const agoraNaAgua =
            nessie.y > nivelAgua;


        if (
            ultimoNivelAgua !== null &&
            estavaNaAgua !== agoraNaAgua
        ) {

            iniciarAudio();

            somGlub();

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
                i *
                nessie.segmento;


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


        ctx.fillStyle =
            '#111';


        ctx.fillRect(
            41,
            -33,
            4,
            4
        );


        ctx.fillRect(
            47,
            -25,
            7,
            2
        );


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
       ROCHAS
    ================================================== */

    function criarPedra(x) {

        const tamanho =
            42 +
            Math.random() * 82;


        const alturaPedra =
            40 +
            Math.random() * 110;


        const y =
            35 +
            Math.random() *
            (
                altura -
                alturaPedra -
                70
            );


        const porosa =
            Math.random() < 0.42;


        const poros = [];


        if (porosa) {

            const quantidade =
                4 +
                Math.floor(
                    Math.random() * 7
                );


            for (
                let i = 0;
                i < quantidade;
                i++
            ) {

                poros.push({

                    x:
                        0.12 +
                        Math.random() * 0.76,

                    y:
                        0.15 +
                        Math.random() * 0.68,

                    raio:
                        2 +
                        Math.random() * 6
                });
            }
        }


        return {

            x,

            y,

            largura:
                tamanho,

            altura:
                alturaPedra,

            porosa,

            poros
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
        rocha quase totalmente negra,
        sem iluminação ou sombra.
        */

        ctx.fillStyle =
            '#090909';


        ctx.beginPath();


        ctx.moveTo(
            x,
            y + h
        );

        ctx.lineTo(
            x + w * 0.04,
            y + h * 0.42
        );

        ctx.lineTo(
            x + w * 0.16,
            y + h * 0.19
        );

        ctx.lineTo(
            x + w * 0.37,
            y + h * 0.05
        );

        ctx.lineTo(
            x + w * 0.61,
            y
        );

        ctx.lineTo(
            x + w * 0.82,
            y + h * 0.14
        );

        ctx.lineTo(
            x + w * 0.96,
            y + h * 0.48
        );

        ctx.lineTo(
            x + w,
            y + h
        );

        ctx.closePath();

        ctx.fill();


        /*
        Algumas pedras têm poros.
        Eles não aparecem em todas.
        */

        if (
            pedra.porosa
        ) {

            ctx.fillStyle =
                '#272727';


            pedra.poros.forEach(
                poro => {

                    ctx.beginPath();

                    ctx.arc(
                        x +
                        poro.x * w,

                        y +
                        poro.y * h,

                        poro.raio,

                        0,
                        Math.PI * 2
                    );

                    ctx.fill();


                    /*
                    pequeno centro ainda mais escuro,
                    para dar a sensação de cavidade
                    sem criar sombra.
                    */

                    ctx.fillStyle =
                        '#050505';


                    ctx.beginPath();

                    ctx.arc(
                        x +
                        poro.x * w,

                        y +
                        poro.y * h,

                        poro.raio * 0.42,

                        0,
                        Math.PI * 2
                    );

                    ctx.fill();


                    ctx.fillStyle =
                        '#272727';
                }
            );
        }
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
       OBSTÁCULOS
    ================================================== */

    function criarObstaculos() {

        pedras = [];
        cabides = [];


        let x =
            largura + 180;


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
       MOVIMENTO
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

        /*
        A velocidade aumenta muito lentamente.
        O jogador sente uma progressão contínua,
        sem saltos repentinos.
        */

        velocidade =
            Math.min(
                VELOCIDADE_MAXIMA,
                VELOCIDADE_INICIAL +
                tempoJogo * 0.025
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
       CÉU
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

        ctx.globalAlpha =
            1;


        /* splash visual */

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


            ctx.lineWidth =
                2;


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
       INICIAR
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


        atualizarAmbiente(
            agora
        );


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
       CONTROLE DO MOUSE
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
        'mouseenter',
        () => {

            mouseAtivo =
                true;

            area.style.cursor =
                'default';

            canvas.style.cursor =
                'default';
        }
    );


    area.addEventListener(
        'mouseleave',
        () => {

            mouseAtivo =
                false;

            area.style.cursor =
                'default';
        }
    );


    /*
    Clique inicia ou reinicia.
    */

    area.addEventListener(
        'click',
        event => {

            event.preventDefault();


            iniciarAudio();


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


    if (mensagem) {

        mensagem.classList.add(
            'visivel'
        );
    }


    if (botao) {

        botao.style.display =
            'none';
    }


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
