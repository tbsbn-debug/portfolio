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

    let fibras = [];

    let coletados = 0;
    let tempo = TEMPO_TOTAL;

    let iniciado = false;
    let terminou = false;
    let venceu = false;

    let ultimoTempo = 0;

    let padrao = [];


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
    CRIA UM ELEMENTO TÊXTIL
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

            escalaX:
                aleatorio(
                    0.7,
                    1.25
                ),

            escalaY:
                aleatorio(
                    0.7,
                    1.15
                ),

            coletado: false

        };

    }


    /*
    ==================================================
    CRIA TODOS
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
    MOVIMENTO INDIVIDUAL
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
    DESENHA UM AMONTOADO DE FIBRAS
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


        /*
        ----------------------------------------------
        fibras individuais
        ----------------------------------------------
        */

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


            /*
            cria volume oval
            */

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
        ----------------------------------------------
        miolo mais denso
        ----------------------------------------------
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
    GRADE DO TEAR
    ==================================================
    */

    function desenharGrade(
        tempoAtual
    ) {

        ctx.clearRect(
            0,
            0,
            largura,
            altura
        );


        const espacamento = 34;


        ctx.lineWidth = 0.5;


        /*
        linhas horizontais
        */

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


        /*
        linhas verticais
        */

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


        /*
        pequenos cruzamentos
        */

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
    PADRÃO FINAL
    ==================================================
    */

    function criarPadrao() {

        padrao = [];


        const tamanho = 22;

        const colunas =
            Math.ceil(
                largura /
                tamanho
            );

        const linhas =
            Math.ceil(
                altura /
                tamanho
            );


        for (
            let y = 0;
            y < linhas;
            y++
        ) {

            for (
                let x = 0;
                x < colunas;
                x++
            ) {

                const indice =
                    inteiro(
                        0,
                        cores.length - 1
                    );


                padrao.push({

                    x,
                    y,

                    cor:
                        cores[
                            indice
                        ],

                    tipo:
                        inteiro(
                            0,
                            5
                        )

                });

            }

        }

    }


    /*
    ==================================================
    DESENHA O TÊXTIL FINAL
    ==================================================
    */

    function desenharPadraoFinal(
        tempoAtual
    ) {

        ctx.clearRect(
            0,
            0,
            largura,
            altura
        );


        const tamanho = 22;


        padrao.forEach(
            celula => {

                const x =
                    celula.x *
                    tamanho;


                const y =
                    celula.y *
                    tamanho;


                const onda =
                    Math.sin(
                        tempoAtual *
                        0.4 +
                        celula.x *
                        0.3 +
                        celula.y *
                        0.2
                    );


                let larguraCelula =
                    tamanho;


                let alturaCelula =
                    tamanho;


                /*
                padrões geométricos
                */

                if (
                    celula.tipo === 0
                ) {

                    ctx.fillStyle =
                        celula.cor;

                    ctx.fillRect(
                        x,
                        y,
                        larguraCelula,
                        alturaCelula
                    );

                }

                else if (
                    celula.tipo === 1
                ) {

                    ctx.fillStyle =
                        celula.cor;

                    ctx.fillRect(
                        x,
                        y,
                        tamanho / 2,
                        tamanho
                    );

                }

                else if (
                    celula.tipo === 2
                ) {

                    ctx.fillStyle =
                        celula.cor;

                    ctx.fillRect(
                        x,
                        y,
                        tamanho,
                        tamanho / 2
                    );

                }

                else if (
                    celula.tipo === 3
                ) {

                    ctx.fillStyle =
                        celula.cor;

                    ctx.beginPath();

                    ctx.moveTo(
                        x,
                        y
                    );

                    ctx.lineTo(
                        x + tamanho,
                        y
                    );

                    ctx.lineTo(
                        x + tamanho,
                        y + tamanho
                    );

                    ctx.closePath();

                    ctx.fill();

                }

                else if (
                    celula.tipo === 4
                ) {

                    ctx.strokeStyle =
                        celula.cor;

                    ctx.lineWidth =
                        4;

                    ctx.beginPath();

                    ctx.moveTo(
                        x,
                        y + tamanho / 2
                    );

                    ctx.lineTo(
                        x + tamanho,
                        y + tamanho / 2
                    );

                    ctx.stroke();

                }

                else {

                    ctx.strokeStyle =
                        celula.cor;

                    ctx.lineWidth =
                        3;

                    ctx.beginPath();

                    ctx.moveTo(
                        x + tamanho / 2,
                        y
                    );

                    ctx.lineTo(
                        x + tamanho / 2,
                        y + tamanho
                    );

                    ctx.stroke();

                }


                /*
                pequena ondulação
                */

                if (
                    onda > 0.7
                ) {

                    ctx.fillStyle =
                        'rgba(255,255,255,.07)';

                    ctx.fillRect(
                        x,
                        y,
                        tamanho,
                        tamanho
                    );

                }

            }
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

            desenharPadraoFinal(
                tempoAtual
            );

            return;

        }


        desenharGrade(
            tempoAtual
        );


        fibras.forEach(
            fibra => {

                desenharFibra(
                    fibra,
                    tempoAtual
                );

            }
        );


        /*
        marcador do cursor
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
    COLETA
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
    INICIAR
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
    FINALIZAR
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
