(() => {
    'use strict';

    const area = document.getElementById('jogoArea');
    const canvas = document.getElementById('jogoCanvas');

    if (!area || !canvas) {
        console.error('jogo2: elementos do jogo não encontrados.');
        return;
    }

    const ctx = canvas.getContext('2d');

    const pontosEl =
        document.getElementById('jogoPontos');

    const mensagem =
        document.getElementById('jogoMensagem');

    const mensagemTexto =
        document.getElementById('jogoMensagemTexto');


    /* =========================================================
       CONFIGURAÇÕES
    ========================================================= */

    const INICIO_PROFUNDIDADES = 280;

    const VELOCIDADE_INICIAL = 5.5;

    const VELOCIDADE_MAXIMA = 15;

    const INTERVALO_VELOCIDADE = 10;

    const PASSO_VELOCIDADE = 0.35;

    const DURACAO_PROFUNDIDADES = 5;


    /* =========================================================
       ESTADO
    ========================================================= */

    let largura = 0;
    let altura = 0;
    let dpr = 1;

    let jogoAtivo = false;
    let jogoTerminou = false;

    let pontos = 0;

    let velocidade =
        VELOCIDADE_INICIAL;

    let objetos = [];

    let ultimoTempo =
        performance.now();

    let ultimoSpawn = 0;

    let tempoCenario = 0;


    let profundezas = false;

    let transicaoProfundezas = 0;

    let inicioTransicaoProfundezas = 0;


    const roupa = {
        camiseta: false,
        saia: false,
        bone: false
    };


    /* =========================================================
       MOUSE
    ========================================================= */

    const mouse = {
        x: 0,
        y: 0,
        ativo: false
    };


    /* =========================================================
       MONSTRO
    ========================================================= */

    const monstro = {
        x: 0,
        y: 0,
        alvoY: 0,
        estavaNaAgua: false
    };


    /* =========================================================
       CORES
    ========================================================= */

    const coresCeu = [
        '#214d70',
        '#315f7d',
        '#3f7890',
        '#477b96',
        '#527f91',
        '#2f6674',
        '#527f5c',
        '#7c7742',
        '#8b7540'
    ];


    const coresAgua = [
        '#244f68',
        '#285f79',
        '#326f84',
        '#3c7d8b',
        '#3b706b',
        '#536f54',
        '#756d3f',
        '#2d566e',
        '#1d485f'
    ];


    const coresProfundezas = [
        '#07151f',
        '#0a1d29',
        '#0b2431',
        '#0d2b39',
        '#103340'
    ];


    const coresObjetos = [
        '#f4c542',
        '#e8b735',
        '#d99b25',
        '#c97e19',
        '#b85b16',
        '#8e3d24',
        '#b31f28',
        '#e63d32',
        '#214c78',
        '#2d648e',
        '#3d7e9d'
    ];


    /* =========================================================
       ÁUDIO
    ========================================================= */

    let audioContext = null;


    function iniciarAudio() {

        if (!audioContext) {

            const Audio =
                window.AudioContext ||
                window.webkitAudioContext;

            if (!Audio) return;

            audioContext =
                new Audio();

        }


        if (
            audioContext.state ===
            'suspended'
        ) {

            audioContext.resume();

        }

    }


    function tocarTom(
        frequencia,
        duracao,
        volume,
        tipo = 'sine',
        atraso = 0
    ) {

        iniciarAudio();

        if (!audioContext) return;


        const agora =
            audioContext.currentTime +
            atraso;


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
            0.0001,
            agora
        );


        ganho.gain.exponentialRampToValueAtTime(
            volume,
            agora + 0.02
        );


        ganho.gain.exponentialRampToValueAtTime(
            0.0001,
            agora + duracao
        );


        oscilador.connect(ganho);

        ganho.connect(
            audioContext.destination
        );


        oscilador.start(agora);

        oscilador.stop(
            agora +
            duracao +
            0.03
        );

    }


    function somCabide() {

        tocarTom(
            520,
            0.09,
            0.12,
            'triangle'
        );

        tocarTom(
            780,
            0.13,
            0.055,
            'sine',
            0.025
        );

    }


    function somRoupa() {

        tocarTom(
            390,
            0.12,
            0.13,
            'triangle'
        );

        tocarTom(
            520,
            0.14,
            0.10,
            'triangle',
            0.06
        );

        tocarTom(
            780,
            0.22,
            0.09,
            'sine',
            0.12
        );

    }


    function somSplash(entrando) {

        iniciarAudio();

        if (!audioContext) return;


        const agora =
            audioContext.currentTime;


        const osc =
            audioContext.createOscillator();


        const ganho =
            audioContext.createGain();


        osc.type =
            'sine';


        osc.frequency.setValueAtTime(
            entrando ? 105 : 82,
            agora
        );


        osc.frequency.exponentialRampToValueAtTime(
            entrando ? 43 : 34,
            agora + 0.45
        );


        ganho.gain.setValueAtTime(
            0.0001,
            agora
        );


        ganho.gain.exponentialRampToValueAtTime(
            0.13,
            agora + 0.035
        );


        ganho.gain.exponentialRampToValueAtTime(
            0.0001,
            agora + 0.48
        );


        osc.connect(ganho);

        ganho.connect(
            audioContext.destination
        );


        osc.start(agora);

        osc.stop(
            agora + 0.52
        );

    }


    /*
    trovão propositalmente muito mais forte.
    */

    function somTrovao() {

        iniciarAudio();

        if (!audioContext) return;


        const agora =
            audioContext.currentTime;


        const duracao = 2.2;


        const tamanho =
            Math.floor(
                audioContext.sampleRate *
                duracao
            );


        const buffer =
            audioContext.createBuffer(
                1,
                tamanho,
                audioContext.sampleRate
            );


        const dados =
            buffer.getChannelData(0);


        for (
            let i = 0;
            i < tamanho;
            i++
        ) {

            const t =
                i / tamanho;


            const envelope =
                Math.pow(
                    1 - t,
                    1.45
                );


            const pulsacao =
                0.5 +
                0.5 *
                Math.sin(
                    t * 28
                );


            dados[i] =
                (
                    Math.random() * 2 - 1
                ) *
                envelope *
                (
                    0.72 +
                    pulsacao * 0.28
                );

        }


        const ruido =
            audioContext.createBufferSource();


        ruido.buffer =
            buffer;


        const filtro =
            audioContext.createBiquadFilter();


        filtro.type =
            'lowpass';


        filtro.frequency.setValueAtTime(
            390,
            agora
        );


        const ganho =
            audioContext.createGain();


        ganho.gain.setValueAtTime(
            0.0001,
            agora
        );


        ganho.gain.exponentialRampToValueAtTime(
            1.35,
            agora + 0.025
        );


        ganho.gain.exponentialRampToValueAtTime(
            0.0001,
            agora + duracao
        );


        ruido.connect(filtro);

        filtro.connect(ganho);

        ganho.connect(
            audioContext.destination
        );


        ruido.start(agora);


        tocarTom(
            43,
            1.8,
            0.42,
            'sine',
            0.02
        );


        tocarTom(
            31,
            2.1,
            0.30,
            'sine',
            0.06
        );

    }


    /* =========================================================
       UTILIDADES
    ========================================================= */

    function aleatorio(min, max) {

        return Math.random() *
            (max - min) +
            min;

    }


    function inteiro(min, max) {

        return Math.floor(
            aleatorio(
                min,
                max + 1
            )
        );

    }


    function limitar(valor, min, max) {

        return Math.max(
            min,
            Math.min(
                max,
                valor
            )
        );

    }


    function escolher(array) {

        return array[
            inteiro(
                0,
                array.length - 1
            )
        ];

    }


    function distancia(
        ax,
        ay,
        bx,
        by
    ) {

        const dx =
            ax - bx;

        const dy =
            ay - by;

        return Math.sqrt(
            dx * dx +
            dy * dy
        );

    }


    function hexRgb(hex) {

        const h =
            hex.replace('#', '');

        return {
            r: parseInt(
                h.substring(0, 2),
                16
            ),

            g: parseInt(
                h.substring(2, 4),
                16
            ),

            b: parseInt(
                h.substring(4, 6),
                16
            )
        };

    }


    function rgbHex(c) {

        return '#' +
            [
                c.r,
                c.g,
                c.b
            ]
                .map(
                    valor =>
                        Math.round(valor)
                            .toString(16)
                            .padStart(2, '0')
                )
                .join('');

    }


    function misturarCores(
        a,
        b,
        quantidade
    ) {

        const ca =
            hexRgb(a);

        const cb =
            hexRgb(b);


        return rgbHex({

            r:
                ca.r +
                (
                    cb.r -
                    ca.r
                ) *
                quantidade,

            g:
                ca.g +
                (
                    cb.g -
                    ca.g
                ) *
                quantidade,

            b:
                ca.b +
                (
                    cb.b -
                    ca.b
                ) *
                quantidade

        });

    }


    function escurecer(
        cor,
        fator
    ) {

        const c =
            hexRgb(cor);

        return rgbHex({

            r:
                c.r * fator,

            g:
                c.g * fator,

            b:
                c.b * fator

        });

    }


    function corAnimada(
        paleta,
        tempo,
        velocidadeCor
    ) {

        const valor =
            (
                Math.sin(
                    tempo *
                    velocidadeCor
                ) + 1
            ) *
            0.5 *
            (
                paleta.length - 1
            );


        const a =
            Math.floor(valor);


        const b =
            Math.min(
                a + 1,
                paleta.length - 1
            );


        return misturarCores(
            paleta[a],
            paleta[b],
            valor - a
        );

    }


    /* =========================================================
       CANVAS
    ========================================================= */

    function redimensionar() {

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


        if (!mouse.ativo) {

            mouse.x =
                largura * 0.22;

            mouse.y =
                altura * 0.5;

        }

    }


    /* =========================================================
       FUNDO
    ========================================================= */

    function desenharFundo() {

        if (estadoTrovao.ativo) {

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


        if (profundezas) {

            desenharFundoProfundezas();

            return;

        }


        const ceu =
            corAnimada(
                coresCeu,
                tempoCenario,
                0.026
            );


        const agua =
            corAnimada(
                coresAgua,
                tempoCenario * 1.13,
                0.033
            );


        const limite =
            altura * 0.56;


        const gradiente =
            ctx.createLinearGradient(
                0,
                0,
                0,
                altura
            );


        gradiente.addColorStop(
            0,
            ceu
        );


        gradiente.addColorStop(
            0.55,
            misturarCores(
                ceu,
                agua,
                0.5
            )
        );


        gradiente.addColorStop(
            0.56,
            agua
        );


        gradiente.addColorStop(
            1,
            agua
        );


        ctx.fillStyle =
            gradiente;


        ctx.fillRect(
            0,
            0,
            largura,
            altura
        );


        /*
        risco atmosférico.
        */

        desenharRuido(
            0,
            limite
        );


        /*
        ondas abaixo da superfície.
        */

        desenharOndas(
            limite
        );

    }


    function desenharRuido(
        inicio,
        fim
    ) {

        ctx.save();


        for (
            let i = 0;
            i < 130;
            i++
        ) {

            const x =
                (
                    i * 91 +
                    tempoCenario *
                    (
                        4 +
                        i % 4
                    )
                ) %
                largura;


            const y =
                inicio +
                (
                    i * 47.3
                ) %
                Math.max(
                    1,
                    fim - inicio
                );


            ctx.beginPath();

            ctx.moveTo(
                x,
                y
            );


            ctx.lineTo(
                x +
                aleatorio(
                    -24,
                    24
                ),
                y +
                aleatorio(
                    -4,
                    4
                )
            );


            ctx.strokeStyle =
                i % 7 === 0
                    ? 'rgba(218,185,74,.18)'
                    : 'rgba(255,255,255,.055)';


            ctx.lineWidth =
                i % 5 === 0
                    ? 1.1
                    : 0.55;


            ctx.stroke();

        }


        ctx.restore();

    }


    function desenharOndas(
        topo
    ) {

        ctx.save();


        for (
            let camada = 0;
            camada < 18;
            camada++
        ) {

            const y =
                topo +
                15 +
                camada * 34;


            ctx.beginPath();


            for (
                let x = -30;
                x <= largura + 30;
                x += 9
            ) {

                const onda =
                    Math.sin(
                        x * 0.011 +
                        tempoCenario * 0.8 +
                        camada * 0.65
                    ) *
                    (
                        7 +
                        camada * 0.55
                    );


                const onda2 =
                    Math.sin(
                        x * 0.027 -
                        tempoCenario * 0.25 +
                        camada
                    ) *
                    4;


                const yy =
                    y +
                    onda +
                    onda2;


                if (
                    x === -30
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


            ctx.strokeStyle =
                escolher(
                    coresAgua
                );


            ctx.globalAlpha =
                0.15 +
                camada * 0.015;


            ctx.lineWidth =
                1 +
                (camada % 4) *
                0.5;


            ctx.stroke();

        }


        ctx.restore();

    }


    function desenharFundoProfundezas() {

        const gradiente =
            ctx.createLinearGradient(
                0,
                0,
                0,
                altura
            );


        gradiente.addColorStop(
            0,
            '#06131d'
        );


        gradiente.addColorStop(
            0.5,
            '#0a202b'
        );


        gradiente.addColorStop(
            1,
            '#07151f'
        );


        ctx.fillStyle =
            gradiente;


        ctx.fillRect(
            0,
            0,
            largura,
            altura
        );


        /*
        agora tudo é água.
        */

        for (
            let i = 0;
            i < 22;
            i++
        ) {

            const y =
                (
                    i * 58 +
                    tempoCenario *
                    (
                        2.5 +
                        i * 0.11
                    )
                ) %
                altura;


            ctx.beginPath();


            for (
                let x = -40;
                x <= largura + 40;
                x += 10
            ) {

                const yy =
                    y +
                    Math.sin(
                        x * 0.013 +
                        tempoCenario * 0.45 +
                        i
                    ) *
                    (
                        10 +
                        i * 0.35
                    );


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


            ctx.strokeStyle =
                escolher(
                    coresProfundezas
                );


            ctx.globalAlpha =
                0.28;


            ctx.lineWidth =
                1.2 +
                i % 3;


            ctx.stroke();

        }

    }


    /* =========================================================
       RELÂMPAGOS
    ========================================================= */

    const estadoTrovao = {

        ativo: false,

        inicio: 0,

        duracao: 4,

        proximo: 100

    };


    function iniciarTrovao() {

        if (profundezas) return;


        estadoTrovao.ativo =
            true;


        estadoTrovao.inicio =
            performance.now();


        somTrovao();

    }


    function atualizarTrovao() {

        if (
            !estadoTrovao.ativo
        ) return;


        const decorrido =
            (
                performance.now() -
                estadoTrovao.inicio
            ) / 1000;


        if (
            decorrido >=
            estadoTrovao.duracao
        ) {

            estadoTrovao.ativo =
                false;

        }

    }


    function desenharRelampagos() {

        ctx.save();


        for (
            let i = 0;
            i < 8;
            i++
        ) {

            const x =
                (
                    i + 1
                ) /
                9 *
                largura +
                Math.sin(
                    tempoCenario * 2 +
                    i
                ) *
                70;


            const topo =
                aleatorio(
                    -30,
                    altura * 0.15
                );


            const base =
                aleatorio(
                    altura * 0.55,
                    altura * 1.05
                );


            ctx.beginPath();

            ctx.moveTo(
                x,
                topo
            );


            let atualY =
                topo;


            for (
                let j = 0;
                j < 7;
                j++
            ) {

                atualY +=
                    (
                        base -
                        topo
                    ) /
                    7;


                ctx.lineTo(
                    x +
                    aleatorio(
                        -38,
                        38
                    ),
                    atualY
                );

            }


            ctx.strokeStyle =
                '#ffffff';


            ctx.globalAlpha =
                0.88;


            ctx.lineWidth =
                i % 3 === 0
                    ? 2.8
                    : 1.25;


            ctx.stroke();

        }


        ctx.restore();

    }


    /* =========================================================
       PROFUNDEZAS
    ========================================================= */

    function iniciarTransicaoProfundezas() {

        if (
            profundezas ||
            transicaoProfundezas > 0
        ) {
            return;
        }


        estadoTrovao.ativo =
            false;


        inicioTransicaoProfundezas =
            performance.now();


        function atualizarTransicao() {

            if (!jogoAtivo) return;


            const decorrido =
                (
                    performance.now() -
                    inicioTransicaoProfundezas
                ) /
                1000;


            transicaoProfundezas =
                limitar(
                    decorrido /
                    DURACAO_PROFUNDIDADES,
                    0,
                    1
                );


            if (
                transicaoProfundezas >= 1
            ) {

                transicaoProfundezas =
                    1;


                profundezas =
                    true;


                estadoTrovao.ativo =
                    false;


                return;

            }


            requestAnimationFrame(
                atualizarTransicao
            );

        }


        requestAnimationFrame(
            atualizarTransicao
        );

    }


    function desenharTransicaoProfundezas() {

        if (
            transicaoProfundezas <= 0 ||
            transicaoProfundezas >= 1
        ) {
            return;
        }


        const progresso =
            transicaoProfundezas;


        /*
        a superfície da água sobe fisicamente
        de baixo para cima.
        */

        const topo =
            altura -
            progresso *
            (
                altura +
                50
            );


        ctx.save();


        /*
        massa de ondas sinuosas.
        */

        for (
            let i = 0;
            i < 25;
            i++
        ) {

            const y =
                topo +
                i * 27;


            ctx.beginPath();


            for (
                let x = -40;
                x <= largura + 40;
                x += 8
            ) {

                const onda =
                    Math.sin(
                        x * 0.012 +
                        tempoCenario * 0.65 +
                        i * 0.5
                    ) *
                    (
                        9 +
                        i * 0.35
                    );


                const onda2 =
                    Math.sin(
                        x * 0.025 -
                        tempoCenario * 0.3 +
                        i
                    ) *
                    5;


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


            const base =
                escolher(
                    coresAgua
                );


            ctx.strokeStyle =
                escurecer(
                    base,
                    1 -
                    progresso *
                    0.68
                );


            ctx.globalAlpha =
                0.25;


            ctx.lineWidth =
                1.4 +
                i % 4;


            ctx.stroke();

        }


        /*
        quanto mais água sobe, mais escuro fica o céu
        que ainda resta.
        */

        if (
            topo > 0
        ) {

            ctx.fillStyle =
                `rgba(0,0,0,${
                    progresso * 0.72
                })`;


            ctx.fillRect(
                0,
                0,
                largura,
                topo
            );

        }


        ctx.restore();

    }


    /* =========================================================
       OBJETOS
    ========================================================= */

    function criarRocha() {

        return {

            tipo: 'rocha',

            x:
                largura + 90,

            y:
                aleatorio(
                    altura * 0.18,
                    altura * 0.78
                ),

            largura:
                aleatorio(
                    42,
                    82
                ),

            altura:
                aleatorio(
                    45,
                    105
                ),

            fase:
                aleatorio(
                    0,
                    Math.PI * 2
                ),

            removido:
                false

        };

    }


    function criarCabide() {

        return {

            tipo: 'cabide',

            x:
                largura + 70,

            y:
                aleatorio(
                    altura * 0.16,
                    altura * 0.78
                ),

            tamanho:
                aleatorio(
                    23,
                    31
                ),

            fase:
                aleatorio(
                    0,
                    Math.PI * 2
                ),

            coletado:
                false

        };

    }


    function criarCamiseta() {

        return {

            tipo: 'camiseta',

            x:
                largura + 70,

            y:
                aleatorio(
                    altura * 0.18,
                    altura * 0.76
                ),

            tamanho:
                30,

            fase:
                aleatorio(
                    0,
                    Math.PI * 2
                ),

            coletado:
                false

        };

    }


    function criarSaia() {

        return {

            tipo: 'saia',

            x:
                largura + 70,

            y:
                aleatorio(
                    altura * 0.18,
                    altura * 0.76
                ),

            tamanho:
                31,

            fase:
                aleatorio(
                    0,
                    Math.PI * 2
                ),

            coletado:
                false

        };

    }


    function criarBone() {

        return {

            tipo: 'bone',

            x:
                largura + 70,

            y:
                aleatorio(
                    altura * 0.18,
                    altura * 0.72
                ),

            tamanho:
                29,

            fase:
                aleatorio(
                    0,
                    Math.PI * 2
                ),

            coletado:
                false

        };

    }


    function spawnar() {

        const dificuldade =
            Math.min(
                1,
                velocidade /
                VELOCIDADE_MAXIMA
            );


        const chanceRocha =
            0.25 +
            dificuldade *
            0.17;


        if (
            Math.random() <
            chanceRocha
        ) {

            objetos.push(
                criarRocha()
            );

        }


        if (
            Math.random() <
            0.75
        ) {

            objetos.push(
                criarCabide()
            );

        }


        /*
        camiseta rara.
        */

        if (
            pontos >= 20 &&
            Math.random() <
            0.035
        ) {

            objetos.push(
                criarCamiseta()
            );

        }


        /*
        saia depois dos 100.
        */

        if (
            pontos >= 100 &&
            Math.random() <
            0.026
        ) {

            objetos.push(
                criarSaia()
            );

        }


        /*
        boné depois dos 200.
        */

        if (
            pontos >= 200 &&
            Math.random() <
            0.020
        ) {

            objetos.push(
                criarBone()
            );

        }

    }


    function atualizarObjetos(
        delta
    ) {

        const movimento =
            velocidade *
            delta *
            60;


        objetos.forEach(
            objeto => {

                if (
                    objeto.coletado ||
                    objeto.removido
                ) {
                    return;
                }


                objeto.x -=
                    movimento;


                objeto.y +=
                    Math.sin(
                        tempoCenario *
                        1.15 +
                        objeto.fase
                    ) *
                    0.32;

            }
        );


        objetos =
            objetos.filter(
                objeto =>
                    objeto.x >
                    -150 &&
                    !objeto.removido
            );

    }


    /* =========================================================
       DESENHO DAS ROCHAS
    ========================================================= */

    function desenharRocha(
        objeto
    ) {

        ctx.save();


        ctx.translate(
            objeto.x,
            objeto.y
        );


        ctx.fillStyle =
            '#000000';


        ctx.beginPath();


        ctx.moveTo(
            -objeto.largura * 0.5,
            objeto.altura * 0.5
        );


        ctx.lineTo(
            -objeto.largura * 0.46,
            -objeto.altura * 0.10
        );


        ctx.lineTo(
            -objeto.largura * 0.18,
            -objeto.altura * 0.5
        );


        ctx.lineTo(
            objeto.largura * 0.17,
            -objeto.altura * 0.43
        );


        ctx.lineTo(
            objeto.largura * 0.49,
            -objeto.altura * 0.06
        );


        ctx.lineTo(
            objeto.largura * 0.42,
            objeto.altura * 0.46
        );


        ctx.closePath();

        ctx.fill();


        /*
        algumas pedras têm porosidades.
        */

        if (
            Math.sin(
                objeto.fase * 4
            ) > 0.35
        ) {

            ctx.fillStyle =
                'rgba(255,255,255,.15)';


            for (
                let i = 0;
                i < 4;
                i++
            ) {

                ctx.beginPath();


                ctx.arc(
                    aleatorio(
                        -objeto.largura * 0.25,
                        objeto.largura * 0.25
                    ),

                    aleatorio(
                        -objeto.altura * 0.25,
                        objeto.altura * 0.25
                    ),

                    aleatorio(
                        2,
                        6
                    ),

                    0,
                    Math.PI * 2
                );


                ctx.fill();

            }

        }


        ctx.restore();

    }


    /* =========================================================
       CABIDE
    ========================================================= */

    function desenharCabide(
        objeto
    ) {

        ctx.save();


        ctx.translate(
            objeto.x,
            objeto.y
        );


        const tamanho =
            objeto.tamanho;


        ctx.strokeStyle =
            '#f1c52f';


        ctx.lineWidth =
            4;


        ctx.lineCap =
            'round';


        ctx.lineJoin =
            'round';


        ctx.beginPath();


        /*
        gancho tradicional.
        */

        ctx.moveTo(
            0,
            -tamanho * 0.42
        );


        ctx.bezierCurveTo(
            tamanho * 0.20,
            -tamanho * 0.68,

            tamanho * 0.43,
            -tamanho * 0.42,

            tamanho * 0.24,
            -tamanho * 0.18
        );


        ctx.lineTo(
            0,
            -tamanho * 0.02
        );


        ctx.lineTo(
            -tamanho * 0.52,
            tamanho * 0.38
        );


        ctx.lineTo(
            tamanho * 0.52,
            tamanho * 0.38
        );


        ctx.closePath();


        ctx.stroke();


        ctx.restore();

    }


    /* =========================================================
       CAMISETA
    ========================================================= */

    function desenharCamiseta(
        objeto
    ) {

        ctx.save();


        ctx.translate(
            objeto.x,
            objeto.y
        );


        desenharCabide({
            x: 0,
            y: 0,
            tamanho: objeto.tamanho
        });


        ctx.fillStyle =
            '#ffffff';


        ctx.beginPath();


        ctx.moveTo(
            -objeto.tamanho * 0.48,
            objeto.tamanho * 0.28
        );


        ctx.lineTo(
            -objeto.tamanho * 0.16,
            objeto.tamanho * 0.08
        );


        ctx.lineTo(
            0,
            objeto.tamanho * 0.25
        );


        ctx.lineTo(
            objeto.tamanho * 0.16,
            objeto.tamanho * 0.08
        );


        ctx.lineTo(
            objeto.tamanho * 0.48,
            objeto.tamanho * 0.28
        );


        ctx.lineTo(
            objeto.tamanho * 0.30,
            objeto.tamanho * 0.72
        );


        ctx.lineTo(
            -objeto.tamanho * 0.30,
            objeto.tamanho * 0.72
        );


        ctx.closePath();


        ctx.fill();


        ctx.restore();

    }


    /* =========================================================
       SAIA
    ========================================================= */

    function desenharSaia(
        objeto
    ) {

        ctx.save();


        ctx.translate(
            objeto.x,
            objeto.y
        );


        ctx.fillStyle =
            '#f1d36b';


        ctx.beginPath();


        ctx.moveTo(
            -objeto.tamanho * 0.52,
            -objeto.tamanho * 0.12
        );


        ctx.lineTo(
            objeto.tamanho * 0.52,
            -objeto.tamanho * 0.12
        );


        ctx.lineTo(
            objeto.tamanho * 0.38,
            objeto.tamanho * 0.55
        );


        ctx.lineTo(
            -objeto.tamanho * 0.38,
            objeto.tamanho * 0.55
        );


        ctx.closePath();


        ctx.fill();


        ctx.restore();

    }


    /* =========================================================
       BONÉ
    ========================================================= */

    function desenharBone(
        objeto
    ) {

        ctx.save();


        ctx.translate(
            objeto.x,
            objeto.y
        );


        ctx.fillStyle =
            '#c83232';


        ctx.beginPath();


        ctx.arc(
            0,
            0,
            objeto.tamanho * 0.38,
            Math.PI,
            0
        );


        ctx.lineTo(
            objeto.tamanho * 0.52,
            objeto.tamanho * 0.12
        );


        ctx.lineTo(
            -objeto.tamanho * 0.52,
            objeto.tamanho * 0.12
        );


        ctx.closePath();


        ctx.fill();


        ctx.restore();

    }


    function desenharObjetos() {

        objetos.forEach(
            objeto => {

                if (
                    objeto.coletado ||
                    objeto.removido
                ) {
                    return;
                }


                if (
                    objeto.tipo ===
                    'rocha'
                ) {

                    desenharRocha(
                        objeto
                    );

                }


                else if (
                    objeto.tipo ===
                    'cabide'
                ) {

                    desenharCabide(
                        objeto
                    );

                }


                else if (
                    objeto.tipo ===
                    'camiseta'
                ) {

                    desenharCamiseta(
                        objeto
                    );

                }


                else if (
                    objeto.tipo ===
                    'saia'
                ) {

                    desenharSaia(
                        objeto
                    );

                }


                else if (
                    objeto.tipo ===
                    'bone'
                ) {

                    desenharBone(
                        objeto
                    );

                }

            }
        );

    }


    /* =========================================================
       MONSTRO
    ========================================================= */

    function atualizarMonstro(
        delta
    ) {

        const alvo =
            limitar(
                mouse.y,
                60,
                altura - 70
            );


        monstro.alvoY =
            alvo;


        monstro.y +=
            (
                alvo -
                monstro.y
            ) *
            Math.min(
                1,
                delta * 8
            );


        monstro.x =
            largura * 0.22;

    }


    function monstroNaAgua() {

        if (profundezas) {
            return true;
        }


        return (
            monstro.y >
            altura * 0.56
        );

    }


    function atualizarAgua() {

        const agora =
            monstroNaAgua();


        if (
            agora !==
            monstro.estavaNaAgua
        ) {

            somSplash(
                agora
            );


            monstro.estavaNaAgua =
                agora;

        }

    }


    function desenharMonstro() {

        const x =
            monstro.x;

        const y =
            monstro.y;


        ctx.save();


        /*
        cauda longa e sinuosa.
        */

        ctx.beginPath();


        ctx.moveTo(
            x - 24,
            y + 13
        );


        for (
            let i = 0;
            i < 9;
            i++
        ) {

            const px =
                x -
                24 -
                i * 28;


            const py =
                y +
                13 +
                Math.sin(
                    tempoCenario * 2.1 +
                    i * 0.65
                ) *
                (
                    8 +
                    i * 1.1
                );


            ctx.lineTo(
                px,
                py
            );

        }


        ctx.strokeStyle =
            '#d6a82f';


        ctx.lineWidth =
            18;


        ctx.lineCap =
            'round';


        ctx.stroke();


        /*
        linha interna.
        */

        ctx.beginPath();


        ctx.moveTo(
            x - 24,
            y + 13
        );


        for (
            let i = 0;
            i < 8;
            i++
        ) {

            const px =
                x -
                24 -
                i * 28;


            const py =
                y +
                13 +
                Math.sin(
                    tempoCenario * 2.1 +
                    i * 0.65
                ) *
                (
                    8 +
                    i * 1.1
                );


            ctx.lineTo(
                px,
                py
            );

        }


        ctx.strokeStyle =
            '#795a18';


        ctx.lineWidth =
            3;


        ctx.stroke();


        /*
        corpo alongado.
        */

        ctx.fillStyle =
            '#e4b934';


        ctx.beginPath();


        ctx.ellipse(
            x,
            y,
            58,
            23,
            0,
            0,
            Math.PI * 2
        );


        ctx.fill();


        /*
        cabeça.
        */

        ctx.beginPath();


        ctx.ellipse(
            x + 55,
            y - 5,
            28,
            26,
            -0.1,
            0,
            Math.PI * 2
        );


        ctx.fillStyle =
            '#efc53d';


        ctx.fill();


        /*
        focinho.
        */

        ctx.beginPath();


        ctx.moveTo(
            x + 72,
            y - 8
        );


        ctx.lineTo(
            x + 105,
            y + 1
        );


        ctx.lineTo(
            x + 73,
            y + 10
        );


        ctx.closePath();


        ctx.fillStyle =
            '#d9aa2d';


        ctx.fill();


        /*
        olho.
        */

        ctx.fillStyle =
            '#111111';


        ctx.fillRect(
            x + 63,
            y - 14,
            5,
            5
        );


        /*
        cristas.
        */

        ctx.fillStyle =
            '#b58321';


        for (
            let i = 0;
            i < 5;
            i++
        ) {

            ctx.beginPath();


            ctx.moveTo(
                x + 27 +
                i * 9,
                y - 22
            );


            ctx.lineTo(
                x + 34 +
                i * 9,
                y - 34 -
                (i % 2) * 4
            );


            ctx.lineTo(
                x + 40 +
                i * 9,
                y - 21
            );


            ctx.closePath();


            ctx.fill();

        }


        /*
        CAMISETA
        */

        if (
            roupa.camiseta
        ) {

            desenharCamisetaNoCorpo(
                x,
                y
            );

        }


        /*
        SAIA:
        atrás do corpo e horizontal.
        */

        if (
            roupa.saia
        ) {

            desenharSaiaNoCorpo(
                x,
                y
            );

        }


        /*
        BONÉ:
        acima do topo da cabeça.
        */

        if (
            roupa.bone
        ) {

            desenharBoneNoTopo(
                x,
                y
            );

        }


        ctx.restore();

    }


    function desenharCamisetaNoCorpo(
        x,
        y
    ) {

        ctx.save();


        ctx.fillStyle =
            '#ffffff';


        ctx.beginPath();


        ctx.moveTo(
            x - 36,
            y - 17
        );


        ctx.lineTo(
            x - 7,
            y - 23
        );


        ctx.lineTo(
            x + 23,
            y - 17
        );


        ctx.lineTo(
            x + 15,
            y + 23
        );


        ctx.lineTo(
            x - 27,
            y + 23
        );


        ctx.closePath();


        ctx.fill();


        /*
        mangas.
        */

        ctx.beginPath();


        ctx.moveTo(
            x - 30,
            y - 17
        );


        ctx.lineTo(
            x - 47,
            y - 5
        );


        ctx.lineTo(
            x - 38,
            y + 5
        );


        ctx.lineTo(
            x - 22,
            y - 8
        );


        ctx.closePath();


        ctx.fill();


        ctx.beginPath();


        ctx.moveTo(
            x + 18,
            y - 17
        );


        ctx.lineTo(
            x + 38,
            y - 6
        );


        ctx.lineTo(
            x + 30,
            y + 5
        );


        ctx.lineTo(
            x + 12,
            y - 8
        );


        ctx.closePath();


        ctx.fill();


        ctx.restore();

    }


    function desenharSaiaNoCorpo(
        x,
        y
    ) {

        ctx.save();


        /*
        deslocamento para trás:
        a saia fica principalmente na parte traseira
        do corpo, e não sob a cabeça.
        */

        ctx.translate(
            x - 42,
            y + 6
        );


        /*
        praticamente horizontal.
        */

        ctx.rotate(
            -0.035
        );


        ctx.fillStyle =
            '#f1d36b';


        ctx.beginPath();


        ctx.moveTo(
            -34,
            -7
        );


        ctx.quadraticCurveTo(
            -3,
            -16,
            30,
            -4
        );


        ctx.lineTo(
            40,
            8
        );


        ctx.quadraticCurveTo(
            2,
            20,
            -40,
            9
        );


        ctx.closePath();


        ctx.fill();


        /*
        textura simples.
        */

        ctx.strokeStyle =
            'rgba(130,95,20,.55)';


        ctx.lineWidth =
            1;


        for (
            let i = -27;
            i < 32;
            i += 9
        ) {

            ctx.beginPath();


            ctx.moveTo(
                i,
                -5
            );


            ctx.lineTo(
                i + 3,
                11
            );


            ctx.stroke();

        }


        ctx.restore();

    }


    function desenharBoneNoTopo(
        x,
        y
    ) {

        ctx.save();


        /*
        deslocado bastante para cima:
        nunca deve aparecer na altura da boca.
        */

        ctx.translate(
            x + 58,
            y - 43
        );


        ctx.fillStyle =
            '#c83232';


        ctx.beginPath();


        ctx.arc(
            0,
            0,
            17,
            Math.PI,
            0
        );


        ctx.lineTo(
            22,
            6
        );


        ctx.lineTo(
            -22,
            6
        );


        ctx.closePath();


        ctx.fill();


        /*
        aba do boné.
        */

        ctx.beginPath();


        ctx.moveTo(
            12,
            4
        );


        ctx.quadraticCurveTo(
            30,
            5,
            34,
            11
        );


        ctx.quadraticCurveTo(
            18,
            9,
            10,
            6
        );


        ctx.closePath();


        ctx.fill();


        ctx.restore();

    }


    /* =========================================================
       COLISÕES
    ========================================================= */

    function raioMonstro() {

        return 48;

    }


    function colidiu(
        objeto
    ) {

        const d =
            distancia(
                monstro.x,
                monstro.y,
                objeto.x,
                objeto.y
            );


        if (
            objeto.tipo ===
            'rocha'
        ) {

            return (
                d <
                raioMonstro() +
                Math.max(
                    objeto.largura,
                    objeto.altura
                ) *
                0.34
            );

        }


        return (
            d <
            raioMonstro() +
            (
                objeto.tamanho ||
                25
            ) *
            0.72
        );

    }


    function processarColisoes() {

        if (!jogoAtivo) return;


        for (
            const objeto of objetos
        ) {

            if (
                objeto.coletado ||
                objeto.removido
            ) {
                continue;
            }


            if (
                !colidiu(
                    objeto
                )
            ) {
                continue;
            }


            /*
            ROCHA
            */

            if (
                objeto.tipo ===
                'rocha'
            ) {

                /*
                camiseta é um escudo real:
                ela desaparece,
                a pedra desaparece,
                o jogo continua.
                */

                if (
                    roupa.camiseta
                ) {

                    roupa.camiseta =
                        false;


                    objeto.removido =
                        true;


                    somRoupa();


                    continue;

                }


                terminarJogo();

                return;

            }


            /*
            ITEM COLETADO
            */

            objeto.coletado =
                true;


            if (
                objeto.tipo ===
                'cabide'
            ) {

                pontos += 1;

                somCabide();

            }


            else if (
                objeto.tipo ===
                'camiseta'
            ) {

                pontos += 5;

                roupa.camiseta =
                    true;

                somRoupa();

            }


            else if (
                objeto.tipo ===
                'saia'
            ) {

                pontos += 5;

                roupa.saia =
                    true;

                somRoupa();

            }


            else if (
                objeto.tipo ===
                'bone'
            ) {

                pontos += 5;

                roupa.bone =
                    true;

                somRoupa();

            }


            atualizarPontuacao();

            atualizarVelocidade();

            verificarEventos();

        }

    }


    /* =========================================================
       PONTUAÇÃO / VELOCIDADE
    ========================================================= */

    function atualizarPontuacao() {

        if (
            pontosEl
        ) {

            pontosEl.textContent =
                pontos;

        }

    }


    function atualizarVelocidade() {

        /*
        +0.35 a cada 10 cabides,
        começando em 5.5,
        estabilizando em 15.
        */

        const degraus =
            Math.floor(
                pontos /
                INTERVALO_VELOCIDADE
            );


        velocidade =
            Math.min(
                VELOCIDADE_MAXIMA,

                VELOCIDADE_INICIAL +
                degraus *
                PASSO_VELOCIDADE
            );

    }


    function verificarEventos() {

        /*
        trovão a cada 100:
        100, 200, 300...
        mas nunca depois das profundezas.
        */

        if (
            !profundezas &&
            pontos >=
            estadoTrovao.proximo
        ) {

            iniciarTrovao();


            estadoTrovao.proximo =
                (
                    Math.floor(
                        pontos / 100
                    ) +
                    1
                ) *
                100;

        }


        /*
        profundezas aos 280.
        */

        if (
            !profundezas &&
            transicaoProfundezas === 0 &&
            pontos >=
            INICIO_PROFUNDIDADES
        ) {

            iniciarTransicaoProfundezas();

        }

    }


    /* =========================================================
       FINAL / REINÍCIO
    ========================================================= */

    function iniciarJogo() {

        iniciarAudio();


        pontos = 0;

        velocidade =
            VELOCIDADE_INICIAL;


        objetos = [];


        roupa.camiseta =
            false;

        roupa.saia =
            false;

        roupa.bone =
            false;


        jogoAtivo =
            true;

        jogoTerminou =
            false;


        profundezas =
            false;

        transicaoProfundezas =
            0;


        estadoTrovao.ativo =
            false;

        estadoTrovao.proximo =
            100;


        ultimoSpawn =
            performance.now();


        ultimoTempo =
            performance.now();


        monstro.x =
            largura * 0.22;


        monstro.y =
            altura * 0.5;


        monstro.alvoY =
            monstro.y;


        monstro.estavaNaAgua =
            false;


        atualizarPontuacao();


        if (
            mensagem
        ) {

            mensagem.classList.remove(
                'visivel'
            );

        }

    }


    function terminarJogo() {

        jogoAtivo =
            false;

        jogoTerminou =
            true;


        if (
            mensagemTexto
        ) {

            mensagemTexto.innerHTML =
                'o monstro bateu na rocha.<br>' +
                'clique para recomeçar.';

        }


        if (
            mensagem
        ) {

            mensagem.classList.add(
                'visivel'
            );

        }

    }


    /* =========================================================
       LOOP
    ========================================================= */

    function atualizar(
        agora
    ) {

        const delta =
            Math.min(
                0.033,
                (
                    agora -
                    ultimoTempo
                ) /
                1000
            );


        ultimoTempo =
            agora;


        tempoCenario +=
            delta;


        atualizarTrovao();


        if (
            !jogoAtivo
        ) {

            return;

        }


        atualizarMonstro(
            delta
        );


        atualizarAgua();


        /*
        spawn cada vez mais rápido.
        */

        const intervalo =
            Math.max(
                360,
                780 -
                velocidade * 22
            );


        if (
            agora -
            ultimoSpawn >
            intervalo
        ) {

            spawnar();

            ultimoSpawn =
                agora;

        }


        atualizarObjetos(
            delta
        );


        processarColisoes();

    }


    function desenhar() {

        desenharFundo();


        /*
        durante a transição:
        as ondas sobem por cima do cenário.
        */

        if (
            transicaoProfundezas > 0 &&
            !profundezas
        ) {

            desenharTransicaoProfundezas();

        }


        desenharObjetos();


        if (
            jogoAtivo
        ) {

            desenharMonstro();

        }

    }


    function loop(
        agora
    ) {

        atualizar(
            agora
        );


        desenhar();


        requestAnimationFrame(
            loop
        );

    }


    /* =========================================================
       INPUT
    ========================================================= */

    area.addEventListener(
        'mousemove',
        event => {

            const rect =
                area.getBoundingClientRect();


            mouse.x =
                event.clientX -
                rect.left;


            mouse.y =
                event.clientY -
                rect.top;


            mouse.ativo =
                true;

        }
    );


    area.addEventListener(
        'mouseenter',
        () => {

            mouse.ativo =
                true;

        }
    );


    area.addEventListener(
        'mouseleave',
        () => {

            mouse.ativo =
                false;

        }
    );


    /*
    clique:
    começa ou reinicia.
    */

    area.addEventListener(
        'click',
        event => {

            if (
                event.target.closest(
                    'a, button, input, textarea, select'
                )
            ) {

                return;

            }


            iniciarJogo();

        }
    );


    document.addEventListener(
        'keydown',
        event => {

            if (
                event.key.toLowerCase() ===
                'r'
            ) {

                iniciarJogo();

            }

        }
    );


    /* =========================================================
       RESIZE
    ========================================================= */

    window.addEventListener(
        'resize',
        () => {

            redimensionar();

        }
    );


    /* =========================================================
       INICIALIZAÇÃO
    ========================================================= */

    redimensionar();


    jogoAtivo =
        false;


    jogoTerminou =
        false;


    if (
        mensagemTexto
    ) {

        mensagemTexto.innerHTML =
            'clique para entrar no lago.';

    }


    if (
        mensagem
    ) {

        mensagem.classList.add(
            'visivel'
        );

    }


    requestAnimationFrame(
        loop
    );

})();
