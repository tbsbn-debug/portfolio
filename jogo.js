(() => {

    const area = document.getElementById('jogoArea');
    const canvas = document.getElementById('jogoCanvas');
    const ctx = canvas.getContext('2d');

    const pontosEl = document.getElementById('jogoPontos');
    const tempoEl = document.getElementById('jogoTempo');

    const mensagem = document.getElementById('jogoMensagem');
    const mensagemTexto = document.getElementById('jogoMensagemTexto');
    const reiniciar = document.getElementById('jogoReiniciar');


    const TOTAL = 30;
    const TEMPO_TOTAL = 20;


    let largura = 0;
    let altura = 0;
    let dpr = 1;

    let fibras = [];

    let coletados = 0;
    let tempo = TEMPO_TOTAL;

    let iniciado = false;
    let terminou = false;
    let venceu = false;

    let ultimoTempo = 0;

    let audioContext = null;


    let padrao = {
        verticais: [],
        horizontais: [],
        fundo: '#f4f0e8',
        tamanho: 0,
        x: 0,
        y: 0,
        largura: 0,
        altura: 0
    };


    const mouse = {
        x: 0,
        y: 0,
        ativo: false
    };


    /*
    ==================================================
    PALETA DOS FIOS
    ==================================================
    */

    const cores = [
        '#111111',
        '#211714',
        '#553522',
        '#79502f',
        '#a36b2c',
        '#c18b32',
        '#d4a83b',
        '#e0bf59',
        '#7d4635',
        '#a43f32',
        '#8e2727',
        '#263e59',
        '#315c7d',
        '#477b96'
    ];


    /*
    ==================================================
    PALETA DOS FUNDOS DOS TECIDOS
    ==================================================
    */

    const fundosTecido = [
        '#111111',
        '#211714',
        '#553522',
        '#79502f',
        '#a36b2c',
        '#c18b32',
        '#d4a83b',
        '#e0bf59',
        '#7d4635',
        '#a43f32',
        '#8e2727',
        '#263e59',
        '#315c7d',
        '#477b96'
    ];


    /*
    ==================================================
    TIPOS DE FIBRA
    ==================================================
    */

    const tipos = [

        {
            nome: 'algodao',
            raio: 7,
            fibras: 85,
            movimento: 1
        },

        {
            nome: 'la',
            raio: 11,
            fibras: 145,
            movimento: 0.65
        },

        {
            nome: 'seda',
            raio: 5,
            fibras: 65,
            movimento: 1.5
        },

        {
            nome: 'nylon',
            raio: 4,
            fibras: 45,
            movimento: 1.8
        }

    ];


    /*
    ==================================================
    AUDIO
    ==================================================
    */

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


    /*
    ==================================================
    SOM AO PEGAR UM FIO
    ==================================================
    */

    function somFio() {

        iniciarAudio();

        const agora =
            audioContext.currentTime;


        /*
        pequeno "pluck" viscoso
        */

        const oscilador =
            audioContext.createOscillator();

        const ganho =
            audioContext.createGain();


        oscilador.type =
            'triangle';


        oscilador.frequency.setValueAtTime(
            aleatorio(180, 280),
            agora
        );


        oscilador.frequency.exponentialRampToValueAtTime(
            aleatorio(70, 110),
            agora + 0.13
        );


        ganho.gain.setValueAtTime(
            0,
            agora
        );

        ganho.gain.linearRampToValueAtTime(
            0.22,
            agora + 0.008
        );

        ganho.gain.exponentialRampToValueAtTime(
            0.001,
            agora + 0.18
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
            agora + 0.2
        );


        /*
        camada de textura pegajosa
        */

        const buffer =
            audioContext.createBuffer(
                1,
                audioContext.sampleRate * 0.12,
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
                (
                    Math.random() * 2 - 1
                ) *
                (
                    1 - i / dados.length
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

        filtro.frequency.value =
            850;


        const ganhoRuido =
            audioContext.createGain();


        ganhoRuido.gain.setValueAtTime(
            0.12,
            agora
        );

        ganhoRuido.gain.exponentialRampToValueAtTime(
            0.001,
            agora + 0.11
        );


        ruido.connect(
            filtro
        );

        filtro.connect(
            ganhoRuido
        );

        ganhoRuido.connect(
            audioContext.destination
        );


        ruido.start(
            agora
        );

    }


    /*
    ==================================================
    FANFARRA DE VITÓRIA
    ==================================================
    */

    function somVitoria() {

        iniciarAudio();

        const agora =
            audioContext.currentTime;


        const notas = [

            {
                nota: 261.63,
                inicio: 0,
                duracao: 0.55
            },

            {
                nota: 329.63,
                inicio: 0.08,
                duracao: 0.55
            },

            {
                nota: 392.00,
                inicio: 0.16,
                duracao: 0.65
            },

            {
                nota: 523.25,
                inicio: 0.28,
                duracao: 1.1
            },

            {
                nota: 659.25,
                inicio: 0.38,
                duracao: 1.0
            }

        ];


        notas.forEach(
            item => {

                const oscilador =
                    audioContext.createOscillator();

                const ganho =
                    audioContext.createGain();


                oscilador.type =
                    'sawtooth';


                oscilador.frequency.setValueAtTime(
                    item.nota,
                    agora + item.inicio
                );


                ganho.gain.setValueAtTime(
                    0,
                    agora + item.inicio
                );


                ganho.gain.linearRampToValueAtTime(
                    0.075,
                    agora +
                    item.inicio +
                    0.035
                );


                ganho.gain.exponentialRampToValueAtTime(
                    0.001,
                    agora +
                    item.inicio +
                    item.duracao
                );


                oscilador.connect(
                    ganho
                );

                ganho.connect(
                    audioContext.destination
                );


                oscilador.start(
                    agora +
                    item.inicio
                );


                oscilador.stop(
                    agora +
                    item.inicio +
                    item.duracao
                );

            }
        );


        /*
        grave final
        */

        const baixo =
            audioContext.createOscillator();

        const ganhoBaixo =
            audioContext.createGain();


        baixo.type =
            'sine';


        baixo.frequency.setValueAtTime(
            65.41,
            agora + 0.25
        );


        baixo.frequency.exponentialRampToValueAtTime(
            32.70,
            agora + 1.5
        );


        ganhoBaixo.gain.setValueAtTime(
            0,
            agora + 0.25
        );


        ganhoBaixo.gain.linearRampToValueAtTime(
            0.22,
            agora + 0.35
        );


        ganhoBaixo.gain.exponentialRampToValueAtTime(
            0.001,
            agora + 1.6
        );


        baixo.connect(
            ganhoBaixo
        );

        ganhoBaixo.connect(
            audioContext.destination
        );


        baixo.start(
            agora + 0.25
        );

        baixo.stop(
            agora + 1.7
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

        largura = rect.width;
        altura = rect.height;

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
    ALEATORIEDADE
    ==================================================
    */

    function aleatorio(min, max) {

        return (
            Math.random() *
            (max - min)
        ) + min;

    }


    function inteiro(min, max) {

        return Math.floor(
            aleatorio(
                min,
                max + 1
            )
        );

    }


    /*
    ==================================================
    CRIA UMA FIBRA
    ==================================================
    */

    function criarFibra() {

        const tipo =
            tipos[
                inteiro(
                    0,
                    tipos.length - 1
                )
            ];


        const orientacoes = [
            'horizontal',
            'vertical',
            'horizontal',
            'vertical',
            'diagonal'
        ];


        const eixo =
            orientacoes[
                inteiro(
                    0,
                    orientacoes.length - 1
                )
            ];


        let angulo = 0;


        if (
            eixo === 'vertical'
        ) {

            angulo =
                Math.PI / 2;

        }

        else if (
            eixo === 'diagonal'
        ) {

            angulo =
                aleatorio(
                    -0.75,
                    0.75
                );

        }


        const comprimento =
            aleatorio(
                45,
                120
            );


        const espessura =
            tipo.raio *
            aleatorio(
                0.65,
                1.35
            );


        return {

            x:
                aleatorio(
                    50,
                    Math.max(
                        60,
                        largura - 50
                    )
                ),

            y:
                aleatorio(
                    70,
                    Math.max(
                        80,
                        altura - 90
                    )
                ),

            comprimento,

            espessura,

            angulo,

            tipo,

            cor:
                cores[
                    inteiro(
                        0,
                        cores.length - 1
                    )
                ],

            eixo,

            fase:
                aleatorio(
                    0,
                    Math.PI * 2
                ),

            velocidade:
                aleatorio(
                    0.25,
                    1.25
                ) *
                tipo.movimento,

            amplitude:
                aleatorio(
                    15,
                    55
                ),

            coletado: false

        };

    }


    /*
    ==================================================
    CRIA TODAS AS FIBRAS
    ==================================================
    */

    function criarFibras() {

        fibras = [];

        for (
            let i = 0;
            i < TOTAL;
            i++
        ) {

            fibras.push(
                criarFibra()
            );

        }

    }


    /*
    ==================================================
    MOVIMENTO
    ==================================================
    */

    function posicaoFibra(
        fibra,
        tempoAtual
    ) {

        let x = fibra.x;
        let y = fibra.y;


        const onda =
            Math.sin(
                tempoAtual *
                fibra.velocidade +
                fibra.fase
            ) *
            fibra.amplitude;


        if (
            fibra.eixo ===
            'horizontal'
        ) {

            x += onda;

        }

        else if (
            fibra.eixo ===
            'vertical'
        ) {

            y += onda;

        }

        else {

            x += onda;
            y += onda * 0.7;

        }


        return {
            x,
            y
        };

    }


    /*
    ==================================================
    DESENHA FIBRA FELPUDA
    ==================================================
    */

    function desenharFibra(
        fibra,
        tempoAtual
    ) {

        if (
            fibra.coletado
        ) {

            return;

        }


        const pos =
            posicaoFibra(
                fibra,
                tempoAtual
            );


        ctx.save();


        ctx.translate(
            pos.x,
            pos.y
        );


        ctx.rotate(
            fibra.angulo
        );


        for (
            let i = 0;
            i < fibra.tipo.fibras;
            i++
        ) {

            const progresso =
                Math.random();


            const x =
                (
                    progresso -
                    0.5
                ) *
                fibra.comprimento;


            const larguraLocal =
                Math.sin(
                    progresso *
                    Math.PI
                ) *
                fibra.espessura;


            const dispersao =
                aleatorio(
                    -larguraLocal * 1.8,
                    larguraLocal * 1.8
                );


            const curvatura =
                Math.sin(
                    progresso *
                    Math.PI *
                    aleatorio(
                        1,
                        5
                    )
                ) *
                aleatorio(
                    -5,
                    5
                );


            const y =
                dispersao +
                curvatura;


            const comprimentoCerdas =
                aleatorio(
                    3,
                    13
                );


            const direcao =
                aleatorio(
                    0,
                    Math.PI * 2
                );


            const destinoX =
                x +
                Math.cos(
                    direcao
                ) *
                comprimentoCerdas;


            const destinoY =
                y +
                Math.sin(
                    direcao
                ) *
                comprimentoCerdas;


            ctx.beginPath();


            ctx.moveTo(
                x,
                y
            );


            ctx.quadraticCurveTo(
                x +
                comprimentoCerdas *
                0.35,

                y +
                aleatorio(
                    -3,
                    3
                ),

                destinoX,
                destinoY
            );


            ctx.strokeStyle =
                fibra.cor;


            ctx.globalAlpha =
                aleatorio(
                    0.22,
                    0.72
                );


            ctx.lineWidth =
                aleatorio(
                    0.35,
                    fibra.espessura *
                    0.38
                );


            ctx.lineCap =
                'round';


            ctx.stroke();

        }


        /*
        miolo denso
        */

        for (
            let i = 0;
            i < 25;
            i++
        ) {

            const x =
                aleatorio(
                    -fibra.comprimento / 2,
                    fibra.comprimento / 2
                );


            const y =
                aleatorio(
                    -fibra.espessura,
                    fibra.espessura
                );


            ctx.beginPath();


            ctx.arc(
                x,
                y,
                aleatorio(
                    0.6,
                    2.2
                ),
                0,
                Math.PI * 2
            );


            ctx.fillStyle =
                fibra.cor;


            ctx.globalAlpha =
                aleatorio(
                    0.35,
                    0.8
                );


            ctx.fill();

        }


        ctx.globalAlpha = 1;

        ctx.restore();

    }


    /*
    ==================================================
    GRADE
    ==================================================
    */

    function desenharGrade() {

        ctx.clearRect(
            0,
            0,
            largura,
            altura
        );


        const espacamento = 34;


        ctx.lineWidth = 0.5;


        for (
            let y = 0;
            y <= altura;
            y += espacamento
        ) {

            ctx.beginPath();

            ctx.moveTo(
                0,
                y
            );

            ctx.lineTo(
                largura,
                y
            );

            ctx.strokeStyle =
                'rgba(17,17,17,.075)';

            ctx.stroke();

        }


        for (
            let x = 0;
            x <= largura;
            x += espacamento
        ) {

            ctx.beginPath();

            ctx.moveTo(
                x,
                0
            );

            ctx.lineTo(
                x,
                altura
            );

            ctx.strokeStyle =
                'rgba(17,17,17,.075)';

            ctx.stroke();

        }


        ctx.fillStyle =
            'rgba(17,17,17,.12)';


        for (
            let y = 0;
            y <= altura;
            y += espacamento
        ) {

            for (
                let x = 0;
                x <= largura;
                x += espacamento
            ) {

                ctx.fillRect(
                    x - 0.5,
                    y - 0.5,
                    1,
                    1
                );

            }

        }

    }


    /*
    ==================================================
    CRIA TECIDO FINAL
    ==================================================
    */

    function criarPadrao() {

        const tamanho =
            Math.min(
                310,
                largura * 0.42,
                altura * 0.42
            );


        const tecidoLargura =
            tamanho;

        const tecidoAltura =
            tamanho;


        const x =
            (largura -
            tecidoLargura) / 2;


        let y;


        if (
            altura > 650
        ) {

            y =
                altura * 0.18;

        }

        else {

            y =
                altura * 0.58;

        }


        const quantidade =
            inteiro(
                20,
                31
            );


        const espaco =
            tecidoLargura /
            quantidade;


        const verticais = [];
        const horizontais = [];


        const paleta =
            [...cores]
                .sort(
                    () =>
                        Math.random() -
                        0.5
                )
                .slice(
                    0,
                    inteiro(
                        4,
                        7
                    )
                );


        const fundo =
            fundosTecido[
                inteiro(
                    0,
                    fundosTecido.length - 1
                )
            ];


        /*
        URDUME
        */

        for (
            let i = 0;
            i < quantidade;
            i++
        ) {

            const cor =
                paleta[
                    inteiro(
                        0,
                        paleta.length - 1
                    )
                ];


            verticais.push({

                posicao:
                    i * espaco,

                cor,

                espessura:
                    aleatorio(
                        1.2,
                        3.2
                    ),

                opacidade:
                    aleatorio(
                        0.72,
                        1
                    ),

                variacao:
                    aleatorio(
                        -1.8,
                        1.8
                    )

            });

        }


        /*
        TRAMA
        */

        for (
            let i = 0;
            i < quantidade;
            i++
        ) {

            const cor =
                paleta[
                    inteiro(
                        0,
                        paleta.length - 1
                    )
                ];


            horizontais.push({

                posicao:
                    i * espaco,

                cor,

                espessura:
                    aleatorio(
                        1.2,
                        3.2
                    ),

                opacidade:
                    aleatorio(
                        0.72,
                        1
                    ),

                variacao:
                    aleatorio(
                        -1.8,
                        1.8
                    )

            });

        }


        padrao = {

            verticais,

            horizontais,

            fundo,

            tamanho,

            x,

            y,

            largura:
                tecidoLargura,

            altura:
                tecidoAltura

        };

    }


    /*
    ==================================================
    DESENHA TECIDO FINAL
    ==================================================
    */

    function desenharPadraoFinal() {

        ctx.clearRect(
            0,
            0,
            largura,
            altura
        );


        /*
        fundo branco da página
        */

        ctx.fillStyle =
            '#ffffff';

        ctx.fillRect(
            0,
            0,
            largura,
            altura
        );


        const tecido =
            padrao;


        if (
            !tecido.verticais.length
        ) {

            return;

        }


        const x =
            tecido.x;

        const y =
            tecido.y;

        const w =
            tecido.largura;

        const h =
            tecido.altura;


        /*
        sombra
        */

        ctx.fillStyle =
            'rgba(17,17,17,.025)';

        ctx.fillRect(
            x + 4,
            y + 4,
            w,
            h
        );


        /*
        FUNDO ALEATÓRIO DO TECIDO
        */

        ctx.fillStyle =
            tecido.fundo;

        ctx.fillRect(
            x,
            y,
            w,
            h
        );


        /*
        URDUME — VERTICAIS
        */

        tecido.verticais.forEach(
            (fio, indice) => {

                const px =
                    x +
                    fio.posicao;


                ctx.save();


                ctx.beginPath();


                ctx.moveTo(
                    px,
                    y
                );


                ctx.bezierCurveTo(

                    px +
                    fio.variacao,

                    y +
                    h * 0.28,

                    px -
                    fio.variacao,

                    y +
                    h * 0.72,

                    px +
                    Math.sin(
                        indice
                    ) *
                    0.8,

                    y + h

                );


                ctx.strokeStyle =
                    fio.cor;


                ctx.globalAlpha =
                    fio.opacidade;


                ctx.lineWidth =
                    fio.espessura;


                ctx.lineCap =
                    'round';


                ctx.stroke();


                for (
                    let j = 0;
                    j < 7;
                    j++
                ) {

                    const fy =
                        y +
                        (h / 8) *
                        j;


                    ctx.beginPath();


                    ctx.moveTo(
                        px,
                        fy
                    );


                    ctx.lineTo(
                        px +
                        aleatorio(
                            -3,
                            3
                        ),

                        fy +
                        aleatorio(
                            -3,
                            3
                        )
                    );


                    ctx.strokeStyle =
                        fio.cor;


                    ctx.globalAlpha =
                        0.25;


                    ctx.lineWidth =
                        0.45;


                    ctx.stroke();

                }


                ctx.restore();

            }
        );


        /*
        TRAMA — HORIZONTAIS
        */

        tecido.horizontais.forEach(
            (fio, indice) => {

                const py =
                    y +
                    fio.posicao;


                ctx.save();


                ctx.beginPath();


                ctx.moveTo(
                    x,
                    py
                );


                ctx.bezierCurveTo(

                    x +
                    w * 0.28,

                    py +
                    fio.variacao,

                    x +
                    w * 0.72,

                    py -
                    fio.variacao,

                    x + w,

                    py +
                    Math.sin(
                        indice
                    ) *
                    0.8

                );


                ctx.strokeStyle =
                    fio.cor;


                ctx.globalAlpha =
                    fio.opacidade;


                ctx.lineWidth =
                    fio.espessura;


                ctx.lineCap =
                    'round';


                ctx.stroke();


                for (
                    let j = 0;
                    j < 7;
                    j++
                ) {

                    const fx =
                        x +
                        (w / 8) *
                        j;


                    ctx.beginPath();


                    ctx.moveTo(
                        fx,
                        py
                    );


                    ctx.lineTo(
                        fx +
                        aleatorio(
                            -3,
                            3
                        ),

                        py +
                        aleatorio(
                            -3,
                            3
                        )
                    );


                    ctx.strokeStyle =
                        fio.cor;


                    ctx.globalAlpha =
                        0.25;


                    ctx.lineWidth =
                        0.45;


                    ctx.stroke();

                }


                ctx.restore();

            }
        );


        /*
        CRUZAMENTOS
        */

        const cruzamentos =
            tecido.verticais.length *
            tecido.horizontais.length;


        for (
            let i = 0;
            i < cruzamentos;
            i++
        ) {

            if (
                Math.random() >
                0.42
            ) {

                continue;

            }


            const vertical =
                tecido.verticais[
                    inteiro(
                        0,
                        tecido.verticais.length - 1
                    )
                ];


            const horizontal =
                tecido.horizontais[
                    inteiro(
                        0,
                        tecido.horizontais.length - 1
                    )
                ];


            const px =
                x +
                vertical.posicao;


            const py =
                y +
                horizontal.posicao;


            ctx.beginPath();


            ctx.arc(
                px,
                py,
                aleatorio(
                    0.6,
                    1.5
                ),
                0,
                Math.PI * 2
            );


            ctx.fillStyle =
                Math.random() >
                0.5
                    ? vertical.cor
                    : horizontal.cor;


            ctx.globalAlpha =
                0.65;


            ctx.fill();

        }


        /*
        BORDA
        */

        ctx.globalAlpha =
            1;


        ctx.strokeStyle =
            'rgba(17,17,17,.14)';


        ctx.lineWidth =
            0.7;


        ctx.strokeRect(
            x,
            y,
            w,
            h
        );


        /*
        FRANJAS
        */

        for (
            let i = 0;
            i < 18;
            i++
        ) {

            const fx =
                x +
                (w / 17) *
                i;


            ctx.beginPath();


            ctx.moveTo(
                fx,
                y + h
            );


            ctx.quadraticCurveTo(

                fx +
                aleatorio(
                    -3,
                    3
                ),

                y +
                h +
                8,

                fx +
                aleatorio(
                    -3,
                    3
                ),

                y +
                h +
                aleatorio(
                    12,
                    20
                )

            );


            ctx.strokeStyle =
                cores[
                    inteiro(
                        0,
                        cores.length - 1
                    )
                ];


            ctx.globalAlpha =
                0.55;


            ctx.lineWidth =
                aleatorio(
                    0.5,
                    1.2
                );


            ctx.stroke();

        }


        ctx.globalAlpha =
            1;

    }


    /*
    ==================================================
    VERIFICA COLETA
    ==================================================
    */

    function verificarColeta() {

        if (
            !mouse.ativo ||
            terminou
        ) {

            return;

        }


        const tempoAtual =
            performance.now() /
            1000;


        fibras.forEach(
            fibra => {

                if (
                    fibra.coletado
                ) {

                    return;

                }


                const pos =
                    posicaoFibra(
                        fibra,
                        tempoAtual
                    );


                const dx =
                    mouse.x -
                    pos.x;


                const dy =
                    mouse.y -
                    pos.y;


                const distancia =
                    Math.sqrt(
                        dx * dx +
                        dy * dy
                    );


                const raio =
                    Math.max(
                        20,
                        fibra.comprimento *
                        0.22
                    );


                if (
                    distancia <
                    raio
                ) {

                    fibra.coletado =
                        true;


                    coletados++;


                    pontosEl.textContent =
                        coletados;


                    /*
                    SOM DE COLETA
                    */

                    somFio();


                    if (
                        coletados >=
                        TOTAL
                    ) {

                        finalizar(
                            true
                        );

                    }

                }

            }
        );

    }


    /*
    ==================================================
    INICIA O JOGO
    ==================================================
    */

    function iniciar() {

        coletados = 0;

        tempo =
            TEMPO_TOTAL;

        iniciado = true;

        terminou = false;

        venceu = false;


        pontosEl.textContent =
            '0';


        tempoEl.textContent =
            TEMPO_TOTAL;


        mensagem.classList.remove(
            'visivel'
        );


        criarFibras();


        ultimoTempo =
            performance.now();

    }


    /*
    ==================================================
    FINALIZA
    ==================================================
    */

    function finalizar(
        vitoria
    ) {

        terminou = true;

        iniciado = false;


        if (
            vitoria
        ) {

            venceu = true;


            /*
            SOM DE TRIUNFO
            */

            somVitoria();


            criarPadrao();


            mensagemTexto.innerHTML =
                'o têxtil está pronto.<br>' +
                'você construiu a trama.';

        }

        else {

            mensagemTexto.innerHTML =
                'o tempo acabou.<br>' +
                'a trama ficou incompleta.';

        }


        mensagem.classList.add(
            'visivel'
        );

    }


    /*
    ==================================================
    ATUALIZA O TEMPO
    ==================================================
    */

    function atualizarTempo(
        agora
    ) {

        if (
            !iniciado ||
            terminou
        ) {

            ultimoTempo =
                agora;

            return;

        }


        const delta =
            (
                agora -
                ultimoTempo
            ) / 1000;


        ultimoTempo =
            agora;


        tempo -=
            delta;


        if (
            tempo <= 0
        ) {

            tempo = 0;


            tempoEl.textContent =
                '0';


            finalizar(
                false
            );


            return;

        }


        tempoEl.textContent =
            Math.ceil(
                tempo
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

        const tempoAtual =
            agora / 1000;


        atualizarTempo(
            agora
        );


        verificarColeta();


        desenhar(
            tempoAtual
        );


        requestAnimationFrame(
            animar
        );

    }


    /*
    ==================================================
    DESENHA
    ==================================================
    */

    function desenhar(
        tempoAtual
    ) {

        if (
            venceu
        ) {

            desenharPadraoFinal();

            return;

        }


        desenharGrade();


        fibras.forEach(
            fibra => {

                desenharFibra(
                    fibra,
                    tempoAtual
                );

            }
        );


        /*
        marcador discreto
        */

        if (
            mouse.ativo &&
            !terminou
        ) {

            ctx.beginPath();


            ctx.arc(
                mouse.x,
                mouse.y,
                12,
                0,
                Math.PI * 2
            );


            ctx.strokeStyle =
                'rgba(17,17,17,.16)';


            ctx.lineWidth =
                0.7;


            ctx.stroke();

        }

    }


    /*
    ==================================================
    MOUSE
    ==================================================
    */

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
        'mouseleave',
        () => {

            mouse.ativo =
                false;

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


            if (
                !terminou
            ) {

                criarFibras();

            }

            else if (
                venceu
            ) {

                criarPadrao();

            }

        }
    );


    /*
    ==================================================
    BOTÃO REINICIAR
    ==================================================
    */

    reiniciar.addEventListener(
        'click',
        event => {

            event.preventDefault();

            event.stopPropagation();

            iniciar();

        }
    );


    /*
    ==================================================
    TECLA R
    ==================================================
    */

    document.addEventListener(
        'keydown',
        event => {

            if (
                event.key.toLowerCase() ===
                'r'
            ) {

                iniciar();

            }

        }
    );


    /*
    ==================================================
    INICIALIZAÇÃO
    ==================================================
    */

    tamanhoCanvas();

    criarFibras();

    iniciar();

    requestAnimationFrame(
        animar
    );

})();
