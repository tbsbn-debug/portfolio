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

    const VELOCIDADE_INICIAL = 5.5;
    const VELOCIDADE_MAXIMA = 15;

    const INICIO_PROFUNDIDADES = 280;
    const DURACAO_TRANSICAO_PROFUNDIDADES = 5000;


    /* ==================================================
       ESTADO
    ================================================== */

    let jogando = false;
    let terminou = false;

    let pontos = 0;

    let recorde =
        Number(localStorage.getItem('jogo2-recorde')) || 0;

    let velocidade =
        VELOCIDADE_INICIAL;

    let tempoUltimo = 0;
    let tempoJogo = 0;

    let mouseY = 0;
    let mouseAtivo = false;

    let pedras = [];
    let cabides = [];

    let ultimoNivelAgua = null;

    let tempoSplash = 0;

    let camisetaVestida = false;
    let saiaVestida = false;
    let boneVestido = false;

    let vidas = 0;

    let profundezas = false;

    let iniciandoProfundezas = false;
    let inicioTransicaoProfundezas = 0;

    let ultimoMarcoTrovao = 0;

    let invertidoAte = 0;

    let relampagos = [];


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

        oscilador.connect(ganho);
        ganho.connect(
            audioContext.destination
        );

        oscilador.start(agora);

        oscilador.stop(
            agora + duracao
        );
    }


    /* ==================================================
       AMBIENTE
    ================================================== */

    function iniciarAmbiente() {

        if (
            ambienteAtivo ||
            !audioContext
        ) return;

        ambienteAtivo = true;

        const duracao = 4;

        const buffer =
            audioContext.createBuffer(
                1,
                audioContext.sampleRate *
                duracao,
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


        fonte.start();


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


        ambienteOscilador.start();


        proximaVariacaoAmbiente =
            performance.now() + 2500;
    }


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


            ambienteFiltro.frequency
                .linearRampToValueAtTime(
                    350 +
                    Math.random() * 180,
                    agora + 1.4
                );


            ambienteGanho.gain
                .linearRampToValueAtTime(
                    0.008 +
                    Math.random() * 0.008,
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


    /* ==================================================
       SONS
    ================================================== */

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


    function somGlub() {

        if (!audioContext) return;

        const agora =
            audioContext.currentTime;


        const oscilador =
            audioContext.createOscillator();

        const ganho =
            audioContext.createGain();

        const filtro =
            audioContext.createBiquadFilter();


        oscilador.type =
            'sine';


        oscilador.frequency.setValueAtTime(
            170 +
            Math.random() * 35,
            agora
        );


        oscilador.frequency.exponentialRampToValueAtTime(
            72 +
            Math.random() * 20,
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


        oscilador.connect(filtro);

        filtro.connect(ganho);

        ganho.connect(
            audioContext.destination
        );


        oscilador.start();

        oscilador.stop(
            agora + 0.5
        );
    }


    function somTrovão() {

        if (!audioContext) return;

        const agora =
            audioContext.currentTime;

        const duracao =
            1.8;


        const buffer =
            audioContext.createBuffer(
                1,
                audioContext.sampleRate *
                duracao,
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
                i /
                audioContext.sampleRate;


            const envelope =
                Math.pow(
                    1 - t / duracao,
                    2
                );


            dados[i] =
                (
                    Math.random() * 2 - 1
                ) *
                envelope;
        }


        const fonte =
            audioContext.createBufferSource();

        const ganho =
            audioContext.createGain();

        const filtro =
            audioContext.createBiquadFilter();


        fonte.buffer =
            buffer;


        filtro.type =
            'lowpass';

        filtro.frequency.value =
            180;


        ganho.gain.setValueAtTime(
            0.0011,
            agora
        );

        ganho.gain.exponentialRampToValueAtTime(
            0.70,
            agora + 0.035
        );

        ganho.gain.exponentialRampToValueAtTime(
            0.001,
            agora + duracao
        );


        fonte.connect(filtro);
        filtro.connect(ganho);
        ganho.connect(
            audioContext.destination
        );


        fonte.start();

        fonte.stop(
            agora + duracao
        );


        som(
            48,
            1.4,
            'sine',
            0.20
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
       CURSOR
    ================================================== */

    function cursorNativo() {

        area.style.cursor =
            'default';
    }


    function cursorSiteNormal() {

        area.style.cursor =
            '';
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


        let nivelAgua;


        if (
            profundezas
        ) {

            nivelAgua =
                altura;

        } else if (
            iniciandoProfundezas
        ) {

            const progresso =
                Math.min(
                    1,
                    (
                        performance.now() -
                        inicioTransicaoProfundezas
                    ) /
                    DURACAO_TRANSICAO_PROFUNDIDADES
                );


            nivelAgua =
                altura *
                (
                    ALTURA_AGUA +
                    (
                        1 -
                        ALTURA_AGUA
                    ) *
                    progresso
                );

        } else {

            nivelAgua =
                altura *
                ALTURA_AGUA;
        }


        const estavaNaAgua =
            nessie.y >
            nivelAgua;


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
            nessie.y >
            nivelAgua;


        if (
            ultimoNivelAgua !== null &&
            estavaNaAgua !== agoraNaAgua &&
            !profundezas
        ) {

            iniciarAudio();

            somGlub();

            tempoSplash =
                performance.now();
        }


        ultimoNivelAgua =
            agoraNaAgua;
    }


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


        /* corpo */

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


        /* ==================================================
           CAMISETA
        ================================================== */

        if (
            camisetaVestida
        ) {

            ctx.fillStyle =
                '#ffffff';


            ctx.beginPath();

            ctx.moveTo(
                7,
                -14
            );

            ctx.lineTo(
                18,
                -7
            );

            ctx.lineTo(
                26,
                -10
            );

            ctx.lineTo(
                42,
                0
            );

            ctx.lineTo(
                36,
                12
            );

            ctx.lineTo(
                29,
                8
            );

            ctx.lineTo(
                29,
                23
            );

            ctx.lineTo(
                8,
                23
            );

            ctx.lineTo(
                8,
                8
            );

            ctx.lineTo(
                1,
                12
            );

            ctx.lineTo(
                -5,
                0
            );

            ctx.closePath();

            ctx.fill();


            ctx.strokeStyle =
                '#d0d0d0';

            ctx.lineWidth =
                2;

            ctx.beginPath();

            ctx.arc(
                18,
                -7,
                5,
                0,
                Math.PI
            );

            ctx.stroke();
        }


        /* ==================================================
           SAIA AMARELO-CLARA
        ================================================== */

        if (
            saiaVestida
        ) {

            ctx.fillStyle =
                '#f4df83';

            ctx.beginPath();

            ctx.moveTo(
                -12,
                8
            );

            ctx.lineTo(
                20,
                8
            );

            ctx.lineTo(
                27,
                18
            );

            ctx.lineTo(
                -19,
                18
            );

            ctx.closePath();

            ctx.fill();


            ctx.strokeStyle =
                '#ddc663';

            ctx.lineWidth =
                2;

            ctx.beginPath();

            ctx.moveTo(
                -19,
                18
            );

            ctx.lineTo(
                27,
                18
            );

            ctx.stroke();
        }


        /* ==================================================
           BONÉ VERMELHO
        ================================================== */

        if (
            boneVestido
        ) {

            ctx.fillStyle =
                '#c92922';

                       ctx.beginPath();

            ctx.moveTo(
                25,
                -48
            );

            ctx.lineTo(
                46,
                -48
            );

            ctx.lineTo(
                53,
                -42
            );

            ctx.lineTo(
                29,
                -42
            );

            ctx.closePath();

            ctx.fill();


            ctx.fillRect(
                30,
                -54,
                13,
                7
            );
        }


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


        const relampagoAtivo =
            invertidoAte >
            performance.now();


        ctx.fillStyle =
            relampagoAtivo
                ? '#ffffff'
                : '#090909';


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


        if (
            pedra.porosa
        ) {

            ctx.fillStyle =
                relampagoAtivo
                    ? '#d9d9d9'
                    : '#272727';


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


        let tipo =
            'normal';


        /*
        Camiseta continua rara.

        Saia passa a ser possível
        depois dos 100.

        Boné passa a ser possível
        depois dos 200.
        */

        const sorteio =
            Math.random();


        if (
            pontos >= 200 &&
            sorteio < 0.045
        ) {

            tipo =
                'bone';

        } else if (
            pontos >= 100 &&
            sorteio < 0.09
        ) {

            tipo =
                'saia';

        } else if (
            sorteio < 0.12
        ) {

            tipo =
                'camiseta';
        }


        return {

            x,

            y,

            coletado:
                false,

            tipo,

            especial:
                tipo === 'camiseta',

            tamanho:
                tipo === 'camiseta'
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


    function desenharSaiaCabide(
        x,
        y
    ) {

        ctx.fillStyle =
            '#f4df83';


        ctx.beginPath();

        ctx.moveTo(
            x - 14,
            y + 7
        );

        ctx.lineTo(
            x + 14,
            y + 7
        );

        ctx.lineTo(
            x + 21,
            y + 31
        );

        ctx.lineTo(
            x - 21,
            y + 31
        );

        ctx.closePath();

        ctx.fill();
    }


    function desenharBoneCabide(
        x,
        y
    ) {

        ctx.fillStyle =
            '#c92922';


        ctx.fillRect(
            x - 12,
            y + 7,
            25,
            15
        );


        ctx.beginPath();

        ctx.moveTo(
            x - 12,
            y + 7
        );

        ctx.lineTo(
            x + 14,
            y + 7
        );

        ctx.lineTo(
            x + 20,
            y + 13
        );

        ctx.lineTo(
            x - 6,
            y + 13
        );

        ctx.closePath();

        ctx.fill();
    }


    function desenharCabide(cabide) {

        if (
            !cabide ||
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
            cabide.tipo ===
            'camiseta'
        ) {

            desenharCamisa(
                x,
                y + 8
            );
        }


        if (
            cabide.tipo ===
            'saia'
        ) {

            desenharSaiaCabide(
                x,
                y
            );
        }


        if (
            cabide.tipo ===
            'bone'
        ) {

            desenharBoneCabide(
                x,
                y
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
            let i = 0;
            i < pedras.length;
            i++
        ) {

            const pedra =
                pedras[i];


            if (
                colisao(
                    hitbox,
                    pedra
                )
            ) {

                /*
                CAMISETA = ESCUDO

                A pedra atingida é removida
                imediatamente.

                A camiseta desaparece.

                O jogo continua.
                */

                if (
                    camisetaVestida &&
                    vidas > 0
                ) {

                    camisetaVestida =
                        false;

                    vidas =
                        0;


                    pedras.splice(
                        i,
                        1
                    );


                    iniciarAudio();

                    somGlub();


                    nessie.velocidadeY =
                        -3;


                    return false;
                }


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
                    cabide.tipo ===
                    'camiseta'
                ) {

                    pontos += 5;

                    camisetaVestida =
                        true;

                    vidas =
                        1;

                    somCabideEspecial();

                } else {

                    pontos += 1;

                    if (
                        cabide.tipo ===
                        'saia'
                    ) {

                        saiaVestida =
                            true;

                    }


                    if (
                        cabide.tipo ===
                        'bone'
                    ) {

                        boneVestido =
                            true;
                    }


                    somCabideEspecial();
                }


                pontosEl.textContent =
                    pontos;

                                    if (
                        cabide.tipo ===
                        'saia'
                    ) {

                        saiaVestida =
                            true;

                        pontos += 5;
                    }


                    if (
                        cabide.tipo ===
                        'bone'
                    ) {

                        boneVestido =
                            true;

                        pontos += 5;
                    }
            }
        }
    }


    /* ==================================================
       TROVÕES
    ================================================== */

    function criarRelampagos() {

        relampagos = [];


        const quantidade =
            2 +
            Math.floor(
                Math.random() * 3
            );


        for (
            let i = 0;
            i < quantidade;
            i++
        ) {

            const pontosRaio = [];


            let x =
                Math.random() *
                largura;


            let y =
                0;


            const comprimento =
                80 +
                Math.random() *
                (
                    altura *
                    0.45
                );


            while (
                y <
                comprimento
            ) {

                pontosRaio.push({
                    x,
                    y
                });


                x +=
                    (
                        Math.random() -
                        0.5
                    ) *
                    35;


                y +=
                    15 +
                    Math.random() * 30;
            }


            relampagos.push(
                pontosRaio
            );
        }
    }


    function desenharRelampagos() {

        if (
            invertidoAte <=
            performance.now()
        ) return;


        ctx.save();


        ctx.strokeStyle =
            '#ffffff';


        ctx.lineWidth =
            2;


        ctx.shadowBlur =
            0;


        relampagos.forEach(
            raio => {

                ctx.beginPath();


                raio.forEach(
                    (ponto, i) => {

                        if (
                            i === 0
                        ) {

                            ctx.moveTo(
                                ponto.x,
                                ponto.y
                            );

                        } else {

                            ctx.lineTo(
                                ponto.x,
                                ponto.y
                            );
                        }
                    }
                );


                ctx.stroke();
            }
        );


        ctx.restore();
    }


    function verificarTrovão() {


        /*
        Trovão a cada 100 cabides,
        mas apenas uma vez por marco.

        280 inicia as profundezas,
        portanto a transição acontece
        antes do próximo marco.
        */

        if (
            profundezas ||
            iniciandoProfundezas
        ) return;

        const marco =
            Math.floor(
                pontos / 100
            ) * 100;
        const marco =
            Math.floor(
                pontos / 100
            ) * 100;


        if (
            marco >= 100 &&
            marco !== ultimoMarcoTrovao
        ) {

            ultimoMarcoTrovao =
                marco;


            iniciarAudio();

            somTrovão();


            invertidoAte =
                performance.now() +
                4000;


            criarRelampagos();
        }
    }


    /* ==================================================
       PROFUNDEZAS
    ================================================== */

    function iniciarTransicaoProfundezas() {

        if (
            iniciandoProfundezas ||
            profundezas
        ) return;


        iniciandoProfundezas =
            true;


        inicioTransicaoProfundezas =
            performance.now();


        somGlub();
    }


    function atualizarProfundezas() {

        if (
            !iniciandoProfundezas
        ) return;


        const progresso =
            Math.min(
                1,
                (
                    performance.now() -
                    inicioTransicaoProfundezas
                ) /
                DURACAO_TRANSICAO_PROFUNDIDADES
            );


        if (
            progresso >= 1
        ) {

            iniciandoProfundezas =
                false;

            profundezas =
                true;


            ultimoNivelAgua =
                true;
        }
    }


    /* ==================================================
       MARCOS
    ================================================== */

    function verificarMarcos() {

        verificarTrovão();


        if (
            pontos >=
            INICIO_PROFUNDIDADES &&
            !profundezas &&
            !iniciandoProfundezas
        ) {

            iniciarTransicaoProfundezas();
        }


        atualizarProfundezas();
    }


    /* ==================================================
       DIFICULDADE
    ================================================== */

    function atualizarDificuldade() {

        const etapas =
            Math.floor(
                pontos / 10
            );


        velocidade =
            Math.min(
                VELOCIDADE_MAXIMA,

                VELOCIDADE_INICIAL +
                etapas * 0.45
            );
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


        return [

            105 + r * 35,

            115 + g * 35,

            160 + b * 55
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


            if (
                chuva
            ) {

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
        tempo,
        inicio,
        escuridao = 0
    ) {

        ctx.save();


        for (
            let camada = 0;
            camada < 16;
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


            cor[0] *=
                1 - escuridao;

            cor[1] *=
                1 - escuridao;

            cor[2] *=
                1 - escuridao * 0.7;


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

        const trovao =
            invertidoAte >
            performance.now();


        /*
        PROFUNDEZAS JÁ CONCLUÍDAS
        */

        if (
            profundezas
        ) {

            const fundo =
                corVariavel(
                    tempo,
                    4
                );


            fundo[0] *= 0.22;
            fundo[1] *= 0.26;
            fundo[2] *= 0.42;


            ctx.fillStyle =
                rgb(fundo);


            ctx.fillRect(
                0,
                0,
                largura,
                altura
            );


            desenharAgua(
                tempo,
                0,
                0.35
            );


            return;
        }


        /*
        TRANSIÇÃO PARA AS PROFUNDEZAS
        */

        if (
            iniciandoProfundezas
        ) {

            const progresso =
                Math.min(
                    1,
                    (
                        performance.now() -
                        inicioTransicaoProfundezas
                    ) /
                    DURACAO_TRANSICAO_PROFUNDIDADES
                );


            /*
            o topo da água sobe
            progressivamente pela tela
            */

            const nivelAgua =
                altura *
                (
                    1 -
                    progresso
                );


            /*
            o fundo vai escurecendo
            junto com a subida da água
            */

            const escurecimento =
                progresso *
                0.62;


            const fundo =
                corVariavel(
                    tempo,
                    4
                );


            ctx.fillStyle =
                rgb([
                    fundo[0] *
                    (
                        1 -
                        escurecimento
                    ),

                    fundo[1] *
                    (
                        1 -
                        escurecimento
                    ),

                    fundo[2] *
                    (
                        1 -
                        escurecimento *
                        0.65
                    )
                ]);


            ctx.fillRect(
                0,
                0,
                largura,
                altura
            );


            /*
            as próprias ondas coloridas
            sobem junto com a água
            */

            desenharAgua(
                tempo,
                nivelAgua,
                escurecimento
            );


            /*
            mantém o céu acima da água
            visível enquanto a transição acontece
            */

            ctx.fillStyle =
                rgb([
                    fundo[0] *
                    (
                        1 -
                        escurecimento
                    ),

                    fundo[1] *
                    (
                        1 -
                        escurecimento
                    ),

                    fundo[2] *
                    (
                        1 -
                        escurecimento *
                        0.65
                    )
                ]);

            ctx.fillRect(
                0,
                0,
                largura,
                nivelAgua
            );


            /*
            quando a água sobe,
            desenharAgua continua ocupando
            progressivamente a área inferior
            */

            ctx.save();

            ctx.beginPath();

            ctx.rect(
                0,
                nivelAgua,
                largura,
                altura -
                nivelAgua
            );

            ctx.clip();

            desenharAgua(
                tempo,
                nivelAgua,
                escurecimento
            );

            ctx.restore();


            return;
        }


        /*
        CÉU + ÁGUA NORMAL
        */

        const nivel =
            altura * ALTURA_AGUA;


        const ceu =
            corVariavel(
                tempo,
                1
            );


        /*
        DURANTE O TROVÃO:
        tudo absolutamente preto.
        */

        if (
            trovao
        ) {

            ctx.fillStyle =
                '#000000';

            ctx.fillRect(
                0,
                0,
                largura,
                altura
            );


            desenharRelampagos();

            return;
        }


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
            tempo,
            nivel
        );


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


        /*
        SPLASH
        */

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
                12 +
                progresso * 35,
                (
                    12 +
                    progresso * 35
                ) * 0.28,
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

        cursorNativo();


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


        camisetaVestida =
            false;

        saiaVestida =
            false;

        boneVestido =
            false;


        vidas =
            0;


        profundezas =
            false;

        iniciandoProfundezas =
            false;

        inicioTransicaoProfundezas =
            0;


        ultimoMarcoTrovao =
            0;


        invertidoAte =
            0;


        relampagos =
            [];


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

            verificarMarcos();

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
       MOUSE
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

            cursorNativo();

            mouseAtivo =
                true;
        }
    );


    area.addEventListener(
        'mouseleave',
        () => {

            cursorSiteNormal();

            mouseAtivo =
                false;
        }
    );


    /* ==================================================
       CLIQUE
    ================================================== */

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


    cursorSiteNormal();


    requestAnimationFrame(
        animar
    );

})();
