(() => {

    const area = document.getElementById('jogo2Area');
    const canvas = document.getElementById('jogo2Canvas');
    const ctx = canvas.getContext('2d');

    let largura = 0;
    let altura = 0;

    let monstro = {
        x: 160,
        y: 0,
        largura: 110,
        altura: 70,
        velocidadeY: 0
    };

    let rochas = [];
    let cabides = [];

    let pontos = 0;
    let jogoAtivo = false;
    let jogoTerminou = false;

    const tempo = 20;

    const velocidadeInicial = 5.5;
    let velocidadeJogo = velocidadeInicial;

    const gravidade = 0.38;
    const impulso = -0.55;

    let ultimoTempo = 0;

    let camisetaVestida = false;
    let saiaVestida = false;
    let boneVestido = false;

    let profundezas = false;
    let iniciandoProfundezas = false;
    let inicioTransicaoProfundezas = 0;

    const DURACAO_TRANSICAO_PROFUNDIDADES = 5000;

    let ultimoMarcoTrovao = 0;
    let trovoadaAtiva = false;
    let inicioTrovoada = 0;

    const audioCtx =
        new (
            window.AudioContext ||
            window.webkitAudioContext
        )();

    function iniciarAudio() {

        if (
            audioCtx.state ===
            'suspended'
        ) {
            audioCtx.resume();
        }

    }


    function somCabide() {

        iniciarAudio();

        const agora =
            audioCtx.currentTime;

        const oscilador =
            audioCtx.createOscillator();

        const ganho =
            audioCtx.createGain();

        oscilador.type =
            'triangle';

        oscilador.frequency.setValueAtTime(
            494,
            agora
        );

        oscilador.frequency.exponentialRampToValueAtTime(
            659,
            agora + 0.18
        );

        ganho.gain.setValueAtTime(
            0.0001,
            agora
        );

        ganho.gain.exponentialRampToValueAtTime(
            0.13,
            agora + 0.015
        );

        ganho.gain.exponentialRampToValueAtTime(
            0.0001,
            agora + 0.22
        );

        oscilador.connect(
            ganho
        );

        ganho.connect(
            audioCtx.destination
        );

        oscilador.start(
            agora
        );

        oscilador.stop(
            agora + 0.23
        );

    }


    function somCamiseta() {

        iniciarAudio();

        const agora =
            audioCtx.currentTime;

        const oscilador =
            audioCtx.createOscillator();

        const ganho =
            audioCtx.createGain();

        oscilador.type =
            'sine';

        oscilador.frequency.setValueAtTime(
            330,
            agora
        );

        oscilador.frequency.exponentialRampToValueAtTime(
            660,
            agora + 0.3
        );

        ganho.gain.setValueAtTime(
            0.0001,
            agora
        );

        ganho.gain.exponentialRampToValueAtTime(
            0.2,
            agora + 0.025
        );

        ganho.gain.exponentialRampToValueAtTime(
            0.0001,
            agora + 0.35
        );

        oscilador.connect(
            ganho
        );

        ganho.connect(
            audioCtx.destination
        );

        oscilador.start(
            agora
        );

        oscilador.stop(
            agora + 0.36
        );

    }


    function somTrovao() {

        iniciarAudio();

        const agora =
            audioCtx.currentTime;

        const buffer =
            audioCtx.createBuffer(
                1,
                audioCtx.sampleRate * 1.8,
                audioCtx.sampleRate
            );

        const dados =
            buffer.getChannelData(
                0
            );

        for (
            let i = 0;
            i < dados.length;
            i++
        ) {

            const t =
                i /
                audioCtx.sampleRate;

            const envelope =
                Math.exp(
                    -2.5 * t
                );

            dados[i] =
                (
                    Math.random() * 2 -
                    1
                ) *
                envelope;

        }

        const fonte =
            audioCtx.createBufferSource();

        fonte.buffer =
            buffer;

        const filtro =
            audioCtx.createBiquadFilter();

        filtro.type =
            'lowpass';

        filtro.frequency.value =
            180;

        const ganho =
            audioCtx.createGain();

        ganho.gain.value =
            0.62;

        fonte.connect(
            filtro
        );

        filtro.connect(
            ganho
        );

        ganho.connect(
            audioCtx.destination
        );

        fonte.start(
            agora
        );

    }


    function somSplash() {

        iniciarAudio();

        const agora =
            audioCtx.currentTime;

        const oscilador =
            audioCtx.createOscillator();

        const ganho =
            audioCtx.createGain();

        oscilador.type =
            'sine';

        oscilador.frequency.setValueAtTime(
            130,
            agora
        );

        oscilador.frequency.exponentialRampToValueAtTime(
            65,
            agora + 0.35
        );

        ganho.gain.setValueAtTime(
            0.0001,
            agora
        );

        ganho.gain.exponentialRampToValueAtTime(
            0.16,
            agora + 0.025
        );

        ganho.gain.exponentialRampToValueAtTime(
            0.0001,
            agora + 0.4
        );

        oscilador.connect(
            ganho
        );

        ganho.connect(
            audioCtx.destination
        );

        oscilador.start(
            agora
        );

        oscilador.stop(
            agora + 0.41
        );

    }


    function ajustarCanvas() {

        const rect =
            area.getBoundingClientRect();

        largura =
            rect.width;

        altura =
            rect.height;

        const dpr =
            window.devicePixelRatio ||
            1;

        canvas.width =
            largura * dpr;

        canvas.height =
            altura * dpr;

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

        monstro.y =
            altura * 0.48;

    }


    window.addEventListener(
        'resize',
        ajustarCanvas
    );


    ajustarCanvas();


    function rgb(cor) {

        return `
            rgb(
                ${Math.round(cor[0])},
                ${Math.round(cor[1])},
                ${Math.round(cor[2])}
            )
        `;

    }


    function corVariavel(
        tempoAtual,
        deslocamento
    ) {

        const t =
            tempoAtual *
            0.00012;

        const r =
            60 +
            55 *
            Math.sin(
                t +
                deslocamento
            );

        const g =
            100 +
            75 *
            Math.sin(
                t * 0.72 +
                deslocamento * 1.7
            );

        const b =
            145 +
            85 *
            Math.sin(
                t * 0.48 +
                deslocamento * 0.8
            );

        return [
            Math.max(0, r),
            Math.max(0, g),
            Math.max(0, b)
        ];

    }


    function desenharCenario(
        agora
    ) {

        ctx.clearRect(
            0,
            0,
            largura,
            altura
        );


        if (
            profundezas
        ) {

            desenharProfundezas(
                agora
            );

            return;

        }


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

            const topoOndas =
                altura -
                altura * progresso;

            const fundo =
                corVariavel(
                    agora,
                    4
                );

            const escurecimento =
                progresso * 0.68;

            ctx.fillStyle =
                rgb([
                    fundo[0] *
                    (1 - escurecimento),

                    fundo[1] *
                    (1 - escurecimento),

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


            for (
                let camada = 0;
                camada < 16;
                camada++
            ) {

                const yBase =
                    topoOndas +
                    camada * 31;

                const cor =
                    corVariavel(
                        agora +
                        camada * 1000,
                        camada + 7
                    );

                cor[0] *=
                    1 -
                    escurecimento;

                cor[1] *=
                    1 -
                    escurecimento;

                cor[2] *=
                    1 -
                    escurecimento * 0.55;

                ctx.strokeStyle =
                    rgb(cor);

                ctx.globalAlpha =
                    0.62;

                ctx.lineWidth =
                    2;

                ctx.beginPath();


                for (
                    let x = -50;
                    x < largura + 60;
                    x += 15
                ) {

                    const onda =
                        Math.sin(
                            x * 0.028 +
                            agora * 0.001 +
                            camada * 0.8
                        ) * 9;

                    const onda2 =
                        Math.sin(
                            x * 0.011 -
                            agora * 0.0006 +
                            camada
                        ) * 13;

                    const yy =
                        yBase +
                        onda +
                        onda2;


                    if (
                        x === -50
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


            ctx.globalAlpha =
                1;

            return;

        }


        /*
        CÉU + ÁGUA NORMAL
        */

        const metade =
            altura *
            0.53;


        const corCeu =
            corVariavel(
                agora,
                0
            );

        const gradiente =
            ctx.createLinearGradient(
                0,
                0,
                0,
                metade
            );

        gradiente.addColorStop(
            0,
            rgb(corCeu)
        );

        gradiente.addColorStop(
            1,
            rgb([
                corCeu[0] * 0.7,
                corCeu[1] * 0.8,
                corCeu[2] * 0.95
            ])
        );

        ctx.fillStyle =
            gradiente;

        ctx.fillRect(
            0,
            0,
            largura,
            metade
        );


        const corAgua =
            corVariavel(
                agora + 3000,
                3
            );

        ctx.fillStyle =
            rgb([
                corAgua[0] * 0.55,
                corAgua[1] * 0.7,
                corAgua[2]
            ]);

        ctx.fillRect(
            0,
            metade,
            largura,
            altura -
            metade
        );


        /*
        ruído riscado do céu
        */

        ctx.globalAlpha =
            0.23;

        ctx.lineWidth =
            1;

        for (
            let i = 0;
            i < 90;
            i++
        ) {

            const x =
                (
                    i * 137 +
                    agora * 0.018
                ) %
                largura;

            const y =
                (
                    i * 61
                ) %
                metade;

            ctx.strokeStyle =
                rgb(
                    corVariavel(
                        agora +
                        i * 100,
                        i
                    )
                );

            ctx.beginPath();

            ctx.moveTo(
                x,
                y
            );

            ctx.lineTo(
                x + 25 +
                Math.sin(
                    agora *
                    0.001 +
                    i
                ) * 15,
                y + 1
            );

            ctx.stroke();

        }


        /*
        ondas da água
        */

        ctx.globalAlpha =
            0.36;

        for (
            let camada = 0;
            camada < 13;
            camada++
        ) {

            const y =
                metade +
                camada * 34;

            ctx.strokeStyle =
                rgb(
                    corVariavel(
                        agora +
                        camada * 700,
                        camada + 5
                    )
                );

            ctx.lineWidth =
                1.5;

            ctx.beginPath();


            for (
                let x = -40;
                x < largura + 50;
                x += 13
            ) {

                const onda =
                    Math.sin(
                        x * 0.018 +
                        agora *
                        0.001 +
                        camada
                    ) * 8;

                const onda2 =
                    Math.sin(
                        x * 0.006 -
                        agora *
                        0.0005
                    ) * 10;

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

        ctx.globalAlpha =
            1;


        if (
            Math.random() <
            0.0015
        ) {

            desenharChuva(
                agora
            );

        }


        if (
            trovoadaAtiva
        ) {

            desenharTrovoada(
                agora
            );

        }

    }


    function desenharChuva(
        agora
    ) {

        ctx.globalAlpha =
            0.25;

        ctx.strokeStyle =
            'rgba(255,255,255,0.7)';

        ctx.lineWidth =
            1;

        for (
            let i = 0;
            i < 45;
            i++
        ) {

            const x =
                Math.random() *
                largura;

            const y =
                Math.random() *
                altura *
                0.52;

            ctx.beginPath();

            ctx.moveTo(
                x,
                y
            );

            ctx.lineTo(
                x - 3,
                y + 22
            );

            ctx.stroke();

        }

        ctx.globalAlpha =
            1;

    }


    function desenharTrovoada(
        agora
    ) {

        ctx.fillStyle =
            '#000';

        ctx.fillRect(
            0,
            0,
            largura,
            altura
        );


        ctx.strokeStyle =
            '#fff';

        ctx.lineWidth =
            2;

        ctx.globalAlpha =
            0.95;

        for (
            let i = 0;
            i < 5;
            i++
        ) {

            const x =
                Math.random() *
                largura;

            const inicio =
                Math.random() *
                altura *
                0.35;

            ctx.beginPath();

            ctx.moveTo(
                x,
                inicio
            );

            let yy =
                inicio;

            for (
                let j = 0;
                j < 7;
                j++
            ) {

                yy +=
                    18 +
                    Math.random() *
                    28;

                ctx.lineTo(
                    x +
                    (
                        Math.random() -
                        0.5
                    ) *
                    30,
                    yy
                );

            }

            ctx.stroke();

        }

        ctx.globalAlpha =
            1;

    }


    function desenharProfundezas(
        agora
    ) {

        const base =
            corVariavel(
                agora,
                12
            );

        ctx.fillStyle =
            rgb([
                base[0] * 0.22,
                base[1] * 0.28,
                base[2] * 0.38
            ]);

        ctx.fillRect(
            0,
            0,
            largura,
            altura
        );


        ctx.globalAlpha =
            0.38;

        for (
            let camada = 0;
            camada < 22;
            camada++
        ) {

            const y =
                camada *
                30 +
                Math.sin(
                    agora *
                    0.0008 +
                    camada
                ) *
                10;

            ctx.strokeStyle =
                rgb(
                    corVariavel(
                        agora +
                        camada * 800,
                        camada + 20
                    )
                );

            ctx.beginPath();

            for (
                let x = -30;
                x < largura + 40;
                x += 12
            ) {

                const yy =
                    y +
                    Math.sin(
                        x * 0.015 +
                        agora *
                        0.001 +
                        camada
                    ) * 7;

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

            ctx.stroke();

        }

        ctx.globalAlpha =
            1;

    }


    function desenharMonstro() {

        ctx.save();

        ctx.translate(
            monstro.x,
            monstro.y
        );


        /*
        corpo alongado
        */

        ctx.fillStyle =
            '#e8c400';

        ctx.beginPath();

        ctx.moveTo(
            -48,
            4
        );

        ctx.bezierCurveTo(
            -20,
            -20,
            15,
            -22,
            48,
            -5
        );

        ctx.bezierCurveTo(
            62,
            3,
            60,
            19,
            42,
            25
        );

        ctx.bezierCurveTo(
            10,
            37,
            -20,
            25,
            -48,
            14
        );

        ctx.closePath();

        ctx.fill();


        /*
        pescoço / cabeça
        */

        ctx.beginPath();

        ctx.moveTo(
            28,
            -15
        );

        ctx.bezierCurveTo(
            48,
            -45,
            75,
            -45,
            82,
            -21
        );

        ctx.bezierCurveTo(
            87,
            -4,
            75,
            13,
            57,
            13
        );

        ctx.bezierCurveTo(
            43,
            13,
            35,
            2,
            28,
            -15
        );

        ctx.fill();


        /*
        focinho
        */

        ctx.beginPath();

        ctx.moveTo(
            69,
            -18
        );

        ctx.lineTo(
            103,
            -11
        );

        ctx.lineTo(
            106,
            3
        );

        ctx.lineTo(
            74,
            4
        );

        ctx.closePath();

        ctx.fill();


        /*
        olhos
        */

        ctx.fillStyle =
            '#111';

        ctx.fillRect(
            68,
            -28,
            7,
            7
        );

        ctx.fillRect(
            90,
            -18,
            6,
            5
        );


        /*
        cauda
        */

        ctx.fillStyle =
            '#e8c400';

        ctx.beginPath();

        ctx.moveTo(
            -43,
            9
        );

        ctx.bezierCurveTo(
            -82,
            22,
            -100,
            3,
            -115,
            -14
        );

        ctx.bezierCurveTo(
            -90,
            25,
            -75,
            38,
            -43,
            23
        );

        ctx.closePath();

        ctx.fill();


        /*
        camiseta
        */

        if (
            camisetaVestida
        ) {

            ctx.fillStyle =
                '#fff';

            ctx.beginPath();

            ctx.moveTo(
                -24,
                -3
            );

            ctx.lineTo(
                23,
                -5
            );

            ctx.lineTo(
                34,
                25
            );

            ctx.lineTo(
                -31,
                25
            );

            ctx.closePath();

            ctx.fill();


            ctx.fillStyle =
                '#ddd';

            ctx.fillRect(
                -12,
                -1,
                19,
                5
            );

        }


        /*
        saia
        */

        if (
            saiaVestida
        ) {

            ctx.fillStyle =
                '#fff2a3';

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


            ctx.beginPath();

            ctx.moveTo(
                -19,
                18
            );

            ctx.lineTo(
                27,
                18
            );

            ctx.strokeStyle =
                '#d9c86d';

            ctx.stroke();

        }


        /*
        boné
        */

        if (
            boneVestido
        ) {

            ctx.fillStyle =
                '#d9322b';

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


        ctx.restore();

    }


    function desenharRochas() {

        for (
            const rocha of rochas
        ) {

            ctx.save();

            ctx.translate(
                rocha.x,
                rocha.y
            );

            ctx.fillStyle =
                '#000';

            ctx.beginPath();

            ctx.moveTo(
                -rocha.raio,
                rocha.raio * 0.5
            );

            ctx.lineTo(
                -rocha.raio * 0.7,
                -rocha.raio * 0.55
            );

            ctx.lineTo(
                -rocha.raio * 0.15,
                -rocha.raio
            );

            ctx.lineTo(
                rocha.raio * 0.62,
                -rocha.raio * 0.75
            );

            ctx.lineTo(
                rocha.raio,
                rocha.raio * 0.15
            );

            ctx.lineTo(
                rocha.raio * 0.58,
                rocha.raio
            );

            ctx.lineTo(
                -rocha.raio * 0.4,
                rocha.raio * 0.9
            );

            ctx.closePath();

            ctx.fill();


            if (
                rocha.porosa
            ) {

                ctx.fillStyle =
                    '#151515';

                for (
                    let i = 0;
                    i < 7;
                    i++
                ) {

                    const px =
                        (
                            Math.sin(
                                i * 8.3 +
                                rocha.seed
                            ) *
                            rocha.raio *
                            0.5
                        );

                    const py =
                        (
                            Math.cos(
                                i * 4.7 +
                                rocha.seed
                            ) *
                            rocha.raio *
                            0.4
                        );

                    ctx.beginPath();

                    ctx.arc(
                        px,
                        py,
                        2 +
                        i % 3,
                        0,
                        Math.PI * 2
                    );

                    ctx.fill();

                }

            }

            ctx.restore();

        }

    }


    function desenharCabides() {

        for (
            const cabide of cabides
        ) {

            ctx.save();

            ctx.translate(
                cabide.x,
                cabide.y
            );

            if (
                cabide.tipo ===
                'camiseta'
            ) {

                ctx.strokeStyle =
                    '#fff';

                ctx.lineWidth =
                    5;

                ctx.beginPath();

                ctx.moveTo(
                    0,
                    -12
                );

                ctx.bezierCurveTo(
                    -6,
                    -18,
                    5,
                    -21,
                    3,
                    -25
                );

                ctx.bezierCurveTo(
                    2,
                    -30,
                    -4,
                    -30,
                    -6,
                    -26
                );

                ctx.stroke();


                ctx.beginPath();

                ctx.moveTo(
                    0,
                    -10
                );

                ctx.lineTo(
                    -31,
                    13
                );

                ctx.lineTo(
                    31,
                    13
                );

                ctx.closePath();

                ctx.stroke();


                ctx.fillStyle =
                    '#fff';

                ctx.fillRect(
                    -19,
                    13,
                    38,
                    27
                );

            } else if (
                cabide.tipo ===
                'saia'
            ) {

                ctx.strokeStyle =
                    '#fff2a3';

                ctx.lineWidth =
                    6;

                ctx.beginPath();

                ctx.moveTo(
                    0,
                    -17
                );

                ctx.bezierCurveTo(
                    -6,
                    -22,
                    4,
                    -25,
                    3,
                    -30
                );

                ctx.bezierCurveTo(
                    2,
                    -34,
                    -4,
                    -34,
                    -6,
                    -30
                );

                ctx.stroke();


                ctx.beginPath();

                ctx.moveTo(
                    0,
                    -15
                );

                ctx.lineTo(
                    -33,
                    8
                );

                ctx.lineTo(
                    33,
                    8
                );

                ctx.closePath();

                ctx.stroke();

            } else if (
                cabide.tipo ===
                'bone'
            ) {

                ctx.strokeStyle =
                    '#d9322b';

                ctx.lineWidth =
                    6;

                ctx.beginPath();

                ctx.moveTo(
                    0,
                    -17
                );

                ctx.bezierCurveTo(
                    -6,
                    -22,
                    4,
                    -25,
                    3,
                    -30
                );

                ctx.bezierCurveTo(
                    2,
                    -34,
                    -4,
                    -34,
                    -6,
                    -30
                );

                ctx.stroke();


                ctx.beginPath();

                ctx.arc(
                    0,
                    4,
                    23,
                    Math.PI,
                    0
                );

                ctx.stroke();

            } else {

                ctx.strokeStyle =
                    '#f2c900';

                ctx.lineWidth =
                    6;

                ctx.beginPath();

                ctx.moveTo(
                    0,
                    -17
                );

                ctx.bezierCurveTo(
                    -6,
                    -22,
                    4,
                    -25,
                    3,
                    -30
                );

                ctx.bezierCurveTo(
                    2,
                    -34,
                    -4,
                    -34,
                    -6,
                    -30
                );

                ctx.stroke();


                ctx.beginPath();

                ctx.moveTo(
                    0,
                    -15
                );

                ctx.lineTo(
                    -33,
                    10
                );

                ctx.lineTo(
                    33,
                    10
                );

                ctx.closePath();

                ctx.stroke();

            }

            ctx.restore();

        }

    }


    function criarRocha() {

        const raio =
            20 +
            Math.random() *
            22;

        rochas.push({
            x:
                largura +
                raio,

            y:
                altura * 0.25 +
                Math.random() *
                altura * 0.55,

            raio,

            porosa:
                Math.random() <
                0.35,

            seed:
                Math.random() *
                10000
        });

    }


    function criarCabide() {

        let tipo =
            'normal';

        if (
            pontos >= 200 &&
            Math.random() < 0.025
        ) {

            tipo =
                'bone';

        } else if (
            pontos >= 100 &&
            Math.random() < 0.035
        ) {

            tipo =
                'saia';

        } else if (
            Math.random() < 0.018
        ) {

            tipo =
                'camiseta';

        }

        cabides.push({
            x:
                largura +
                40,

            y:
                altura * 0.18 +
                Math.random() *
                altura * 0.62,

            tipo
        });

    }


    function colisao(
        a,
        b
    ) {

        return (
            a.x -
            a.largura / 2 <
            b.x +
            b.raio &&

            a.x +
            a.largura / 2 >
            b.x -
            b.raio &&

            a.y -
            a.altura / 2 <
            b.y +
            b.raio &&

            a.y +
            a.altura / 2 >
            b.y -
            b.raio
        );

    }


    function colisaoCabide(
        cabide
    ) {

        return (
            monstro.x -
            55 <
            cabide.x + 25 &&

            monstro.x +
            70 >
            cabide.x - 25 &&

            monstro.y -
            35 <
            cabide.y + 35 &&

            monstro.y +
            35 >
            cabide.y - 35
        );

    }


    function ativarProfundezas() {

        if (
            profundezas ||
            iniciandoProfundezas
        ) return;

        iniciandoProfundezas =
            true;

        inicioTransicaoProfundezas =
            performance.now();

    }


    function atualizarProfundezas() {

        if (
            iniciandoProfundezas &&
            performance.now() -
            inicioTransicaoProfundezas >=
            DURACAO_TRANSICAO_PROFUNDIDADES
        ) {

            iniciandoProfundezas =
                false;

            profundezas =
                true;

        }

    }


    function atualizar(
        delta
    ) {

        if (
            !jogoAtivo
        ) return;


        velocidadeJogo =
            Math.min(
                15,
                velocidadeInicial +
                Math.floor(
                    pontos / 10
                ) * 0.35
            );


        monstro.velocidadeY +=
            gravidade;

        monstro.y +=
            monstro.velocidadeY;


        if (
            monstro.y <
            35
        ) {

            monstro.y =
                35;

            monstro.velocidadeY =
                0;

        }


        if (
            monstro.y >
            altura - 35
        ) {

            monstro.y =
                altura - 35;

            monstro.velocidadeY =
                0;

        }


        for (
            const rocha of rochas
        ) {

            rocha.x -=
                velocidadeJogo;

        }


        for (
            const cabide of cabides
        ) {

            cabide.x -=
                velocidadeJogo;

        }


        rochas =
            rochas.filter(
                rocha =>
                    rocha.x >
                    -100
            );


        cabides =
            cabides.filter(
                cabide =>
                    cabide.x >
                    -100
            );


        if (
            Math.random() <
            0.018
        ) {

            criarRocha();

        }


        if (
            Math.random() <
            0.018
        ) {

            criarCabide();

        }


        for (
            let i =
                rochas.length -
                1;

            i >= 0;

            i--
        ) {

            const rocha =
                rochas[i];

            if (
                colisao(
                    monstro,
                    rocha
                )
            ) {

                if (
                    camisetaVestida
                ) {

                    camisetaVestida =
                        false;

                    rochas.splice(
                        i,
                        1
                    );

                    somCamiseta();

                } else {

                    finalizarJogo();

                }

            }

        }


        for (
            let i =
                cabides.length -
                1;

            i >= 0;

            i--
        ) {

            const cabide =
                cabides[i];

            if (
                colisaoCabide(
                    cabide
                )
            ) {

                if (
                    cabide.tipo ===
                    'camiseta'
                ) {

                    camisetaVestida =
                        true;

                    somCamiseta();

                } else {

                    if (
                        cabide.tipo ===
                        'saia'
                    ) {

                        saiaVestida =
                            true;

                        pontos += 4;

                    }


                    if (
                        cabide.tipo ===
                        'bone'
                    ) {

                        boneVestido =
                            true;

                        pontos += 4;

                    }

                    somCabide();

                }

                if (
                    cabide.tipo ===
                    'camiseta'
                ) {

                    pontos +=
                        5;

                } else {

                    pontos +=
                        1;

                }

                cabides.splice(
                    i,
                    1
                );

            }

        }


        if (
            pontos >= 280 &&
            !profundezas &&
            !iniciandoProfundezas
        ) {

            ativarProfundezas();

        }


        atualizarProfundezas();

        atualizarTrovoes();

    }


    function atualizarTrovoes() {

        if (
            profundezas ||
            iniciandoProfundezas
        ) return;


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

            trovoadaAtiva =
                true;

            inicioTrovoada =
                performance.now();

            somTrovao();

        }


        if (
            trovoadaAtiva &&
            performance.now() -
            inicioTrovoada >
            4000
        ) {

            trovoadaAtiva =
                false;

        }

    }


    function finalizarJogo() {

        jogoAtivo =
            false;

        jogoTerminou =
            true;

    }


    function reiniciar() {

        iniciarAudio();

        pontos =
            0;

        rochas =
            [];

        cabides =
            [];

        camisetaVestida =
            false;

        saiaVestida =
            false;

        boneVestido =
            false;

        profundezas =
            false;

        iniciandoProfundezas =
            false;

        ultimoMarcoTrovao =
            0;

        trovoadaAtiva =
            false;

        velocidadeJogo =
            velocidadeInicial;

        monstro.x =
            largura *
            0.24;

        monstro.y =
            altura *
            0.48;

        monstro.velocidadeY =
            0;

        jogoTerminou =
            false;

        jogoAtivo =
            true;

    }


    function desenharInterface() {

        ctx.fillStyle =
            '#111';

        ctx.font =
            '13px monospace';

        ctx.textAlign =
            'left';

        ctx.fillText(
            pontos +
            ' cabides',
            20,
            30
        );


        if (
            jogoTerminou
        ) {

            ctx.textAlign =
                'center';

            ctx.font =
                '15px monospace';

            ctx.fillText(
                'clique para jogar novamente',
                largura / 2,
                altura - 35
            );

        }

    }


    function desenhar() {

        const agora =
            performance.now();

        desenharCenario(
            agora
        );

        desenharRochas();

        desenharCabides();

        desenharMonstro();

        desenharInterface();

    }


    function loop(
        agora
    ) {

        const delta =
            agora -
            ultimoTempo;

        ultimoTempo =
            agora;

        atualizar(
            delta
        );

        desenhar();

        requestAnimationFrame(
            loop
        );

    }


    area.addEventListener(
        'mousemove',
        event => {

            const rect =
                area.getBoundingClientRect();

            monstro.y =
                event.clientY -
                rect.top;

        }
    );


    area.addEventListener(
        'click',
        () => {

            iniciarAudio();

            if (
                !jogoAtivo
            ) {

                reiniciar();

                return;

            }

            monstro.velocidadeY +=
                impulso;

        }
    );


    document.addEventListener(
        'keydown',
        event => {

            if (
                event.code ===
                'Space'
            ) {

                iniciarAudio();

                if (
                    !jogoAtivo
                ) {

                    reiniciar();

                } else {

                    monstro.velocidadeY +=
                        impulso;

                }

            }

        }
    );


    requestAnimationFrame(
        loop
    );

})();
