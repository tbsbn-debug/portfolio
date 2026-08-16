(() => {

    const area = document.getElementById('jogoArea');
    const canvas = document.getElementById('jogoCanvas');
    const ctx = canvas.getContext('2d');

    const pontosEl = document.getElementById('jogoPontos');
    const tempoEl = document.getElementById('jogoTempo');

    const mensagem = document.getElementById('jogoMensagem');
    const mensagemTexto = document.getElementById('jogoMensagemTexto');
    const reiniciar = document.getElementById('jogoReiniciar');


    const TOTAL = 24;
    const TEMPO_TOTAL = 35;


    let largura = 0;
    let altura = 0;
    let dpr = 1;

    let fios = [];

    let coletados = 0;
    let tempo = TEMPO_TOTAL;

    let iniciado = false;
    let terminou = false;

    let ultimoTempo = 0;


    const mouse = {
        x: 0,
        y: 0,
        ativo: false
    };


    /*
    ==================================================
    PALETA
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
    TIPOS DE FIBRA
    ==================================================
    */

    const tipos = [

        {
            nome: 'algodao',
            espessura: 1.8,
            densidade: 26,
            brilho: 0.04,
            irregularidade: 3.5
        },

        {
            nome: 'la',
            espessura: 4.2,
            densidade: 42,
            brilho: 0.02,
            irregularidade: 7
        },

        {
            nome: 'seda',
            espessura: 1.4,
            densidade: 18,
            brilho: 0.32,
            irregularidade: 1.8
        },

        {
            nome: 'nylon',
            espessura: 1.1,
            densidade: 14,
            brilho: 0.45,
            irregularidade: 1
        }

    ];


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


        const orientacao =
            [
                0,
                0,
                0,
                1,
                1,
                2
            ][
                inteiro(
                    0,
                    5
                )
            ];


        let angulo;


        if (orientacao === 0) {

            angulo =
                aleatorio(
                    -0.18,
                    0.18
                );

        }

        else if (orientacao === 1) {

            angulo =
                Math.PI / 2 +
                aleatorio(
                    -0.18,
                    0.18
                );

        }

        else {

            angulo =
                aleatorio(
                    -0.75,
                    0.75
                );

        }


        const comprimento =
            aleatorio(
                55,
                145
            );


        const larguraFibra =
            tipo.espessura *
            aleatorio(
                0.75,
                1.45
            );


        const pontos = [];


        const quantidade =
            Math.max(
                18,
                Math.floor(
                    comprimento / 4
                )
            );


        for (
            let i = 0;
            i <= quantidade;
            i++
        ) {

            const progresso =
                i / quantidade;


            const onda =
                Math.sin(
                    progresso *
                    Math.PI *
                    inteiro(
                        1,
                        4
                    )
                ) *
                aleatorio(
                    1,
                    4
                );


            const ruido =
                aleatorio(
                    -tipo.irregularidade,
                    tipo.irregularidade
                );


            pontos.push({

                x:
                    progresso *
                    comprimento,

                y:
                    onda +
                    ruido

            });

        }


        return {

            x:
                aleatorio(
                    45,
                    Math.max(
                        50,
                        largura - 45
                    )
                ),

            y:
                aleatorio(
                    65,
                    Math.max(
                        70,
                        altura - 80
                    )
                ),

            angulo,

            comprimento,

            largura:
                larguraFibra,

            pontos,

            tipo,

            cor:
                cores[
                    inteiro(
                        0,
                        cores.length - 1
                    )
                ],

            fase:
                aleatorio(
                    0,
                    Math.PI * 2
                ),

            velocidade:
                aleatorio(
                    0.35,
                    1.65
                ),

            amplitude:
                aleatorio(
                    4,
                    15
                ),

            rotacao:
                aleatorio(
                    -0.003,
                    0.003
                ),

            escala:
                aleatorio(
                    0.75,
                    1.15
                ),

            coletado: false

        };

    }


    /*
    ==================================================
    CRIA TODOS OS FIOS
    ==================================================
    */

    function criarFios() {

        fios = [];

        for (
            let i = 0;
            i < TOTAL;
            i++
        ) {

            fios.push(
                criarFibra()
            );

        }

    }


    /*
    ==================================================
    DESENHA UMA FIBRA
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


        const movimento =
            Math.sin(
                tempoAtual *
                fibra.velocidade +
                fibra.fase
            ) *
            fibra.amplitude;


        ctx.save();


        ctx.translate(
            fibra.x,
            fibra.y + movimento
        );


        ctx.rotate(
            fibra.angulo +
            Math.sin(
                tempoAtual *
                0.35 +
                fibra.fase
            ) *
            0.035
        );


        ctx.scale(
            fibra.escala,
            fibra.escala
        );


        /*
        ----------------------------------------------
        camada principal
        ----------------------------------------------
        */

        ctx.beginPath();


        fibra.pontos.forEach(
            (ponto, indice) => {

                if (
                    indice === 0
                ) {

                    ctx.moveTo(
                        ponto.x,
                        ponto.y
                    );

                }

                else {

                    ctx.lineTo(
                        ponto.x,
                        ponto.y
                    );

                }

            }
        );


        ctx.strokeStyle =
            fibra.cor;

        ctx.lineWidth =
            fibra.largura;

        ctx.lineCap =
            'round';

        ctx.lineJoin =
            'round';

        ctx.stroke();


        /*
        ----------------------------------------------
        pequenas fibras soltas
        ----------------------------------------------
        */

        const quantidadeFios =
            fibra.tipo.densidade;


        for (
            let i = 0;
            i < quantidadeFios;
            i++
        ) {

            const ponto =
                fibra.pontos[
                    inteiro(
                        0,
                        fibra.pontos.length - 1
                    )
                ];


            const comprimento =
                aleatorio(
                    2,
                    9
                );


            const direcao =
                aleatorio(
                    -Math.PI,
                    Math.PI
                );


            ctx.beginPath();


            ctx.moveTo(
                ponto.x,
                ponto.y
            );


            ctx.lineTo(
                ponto.x +
                Math.cos(
                    direcao
                ) *
                comprimento,

                ponto.y +
                Math.sin(
                    direcao
                ) *
                comprimento
            );


            ctx.strokeStyle =
                fibra.cor;

            ctx.globalAlpha =
                aleatorio(
                    0.15,
                    0.55
                );


            ctx.lineWidth =
                aleatorio(
                    0.35,
                    fibra.largura * 0.55
                );


            ctx.stroke();

        }


        /*
        ----------------------------------------------
        brilho para seda e nylon
        ----------------------------------------------
        */

        if (
            fibra.tipo.brilho >
            0.1
        ) {

            ctx.beginPath();


            fibra.pontos.forEach(
                (ponto, indice) => {

                    if (
                        indice === 0
                    ) {

                        ctx.moveTo(
                            ponto.x,
                            ponto.y -
                            fibra.largura *
                            0.35
                        );

                    }

                    else {

                        ctx.lineTo(
                            ponto.x,
                            ponto.y -
                            fibra.largura *
                            0.35
                        );

                    }

                }
            );


            ctx.strokeStyle =
                '#ffffff';

            ctx.globalAlpha =
                fibra.tipo.brilho;

            ctx.lineWidth =
                Math.max(
                    0.3,
                    fibra.largura *
                    0.35
                );

            ctx.stroke();

        }


        ctx.globalAlpha = 1;


        ctx.restore();

    }


    /*
    ==================================================
    TRAMA DE FUNDO
    ==================================================
    */

    function desenharTrama(
        tempoAtual
    ) {

        ctx.clearRect(
            0,
            0,
            largura,
            altura
        );


        const linhas = 18;

        const espacamento =
            altura /
            (linhas + 1);


        ctx.lineWidth =
            0.35;


        for (
            let i = 1;
            i <= linhas;
            i++
        ) {

            const baseY =
                espacamento * i;


            ctx.beginPath();


            for (
                let x = 0;
                x <= largura;
                x += 14
            ) {

                const onda =
                    Math.sin(
                        x * 0.012 +
                        tempoAtual * 0.2 +
                        i
                    ) * 2;


                const y =
                    baseY +
                    onda;


                if (
                    x === 0
                ) {

                    ctx.moveTo(
                        x,
                        y
                    );

                }

                else {

                    ctx.lineTo(
                        x,
                        y
                    );

                }

            }


            ctx.strokeStyle =
                'rgba(17,17,17,.045)';

            ctx.stroke();

        }

    }


    /*
    ==================================================
    DESENHA TUDO
    ==================================================
    */

    function desenhar(
        tempoAtual
    ) {

        desenharTrama(
            tempoAtual
        );


        fios.forEach(
            fibra => {

                desenharFibra(
                    fibra,
                    tempoAtual
                );

            }
        );


        if (
            mouse.ativo &&
            !terminou
        ) {

            ctx.beginPath();


            ctx.arc(
                mouse.x,
                mouse.y,
                13,
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
    COLISÃO
    ==================================================
    */

    function verificarColeta() {

        if (
            !mouse.ativo ||
            terminou
        ) {

            return;

        }


        fios.forEach(
            fibra => {

                if (
                    fibra.coletado
                ) {

                    return;

                }


                const dx =
                    mouse.x -
                    fibra.x;


                const dy =
                    mouse.y -
                    fibra.y;


                const distancia =
                    Math.sqrt(
                        dx * dx +
                        dy * dy
                    );


                const margem =
                    Math.max(
                        20,
                        fibra.comprimento *
                        0.18
                    );


                if (
                    distancia <
                    margem
                ) {

                    fibra.coletado =
                        true;


                    coletados++;


                    pontosEl.textContent =
                        coletados;


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
    INICIA
    ==================================================
    */

    function iniciar() {

        coletados = 0;

        tempo =
            TEMPO_TOTAL;

        iniciado = true;

        terminou = false;


        pontosEl.textContent =
            '0';


        tempoEl.textContent =
            TEMPO_TOTAL;


        mensagem.classList.remove(
            'visivel'
        );


        criarFios();


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

            mensagemTexto.innerHTML =
                'a trama está completa.<br>' +
                'você encontrou todos os fios.';

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
    TEMPO
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

            criarFios();

        }
    );


    /*
    ==================================================
    REINICIAR
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
                event.key.toLowerCase() === 'r'
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

    criarFios();

    iniciar();

    requestAnimationFrame(
        animar
    );

})();
