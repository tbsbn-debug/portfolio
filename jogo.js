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
    const TEMPO_TOTAL = 60;


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


    const cores = [
        '#111111',
        '#6b5b4b',
        '#9b7350',
        '#b4a189',
        '#7b8065',
        '#c6b24a'
    ];


    /* ==========================================
       TAMANHO DO CANVAS
    ========================================== */

    function tamanhoCanvas() {

        const rect = area.getBoundingClientRect();

        largura = rect.width;
        altura = rect.height;

        dpr = Math.min(
            window.devicePixelRatio || 1,
            2
        );

        canvas.width =
            Math.round(largura * dpr);

        canvas.height =
            Math.round(altura * dpr);

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


    /* ==========================================
       CRIA OS FIOS
    ========================================== */

    function criarFios() {

        fios = [];

        for (let i = 0; i < TOTAL; i++) {

            fios.push({

                x:
                    80 +
                    Math.random() *
                    Math.max(
                        100,
                        largura - 160
                    ),

                y:
                    70 +
                    Math.random() *
                    Math.max(
                        100,
                        altura - 150
                    ),

                raio:
                    4 +
                    Math.random() * 3,

                cor:
                    cores[
                        Math.floor(
                            Math.random() *
                            cores.length
                        )
                    ],

                fase:
                    Math.random() *
                    Math.PI *
                    2,

                velocidade:
                    0.5 +
                    Math.random() *
                    1.2,

                coletado: false

            });

        }

    }


    /* ==========================================
       DESENHA UM FIO
    ========================================== */

    function desenharFio(fio, tempoAtual) {

        if (fio.coletado) {
            return;
        }


        const deslocamento =
            Math.sin(
                tempoAtual *
                fio.velocidade +
                fio.fase
            ) * 8;


        const x =
            fio.x +
            deslocamento;


        const y =
            fio.y;


        ctx.beginPath();

        ctx.moveTo(
            x - 10,
            y
        );


        ctx.quadraticCurveTo(
            x,
            y - 12,
            x + 10,
            y
        );


        ctx.quadraticCurveTo(
            x,
            y + 12,
            x - 10,
            y
        );


        ctx.strokeStyle =
            fio.cor;

        ctx.lineWidth = 1.2;

        ctx.stroke();


        ctx.beginPath();

        ctx.arc(
            x,
            y,
            fio.raio,
            0,
            Math.PI * 2
        );


        ctx.fillStyle =
            fio.cor;

        ctx.fill();

    }


    /* ==========================================
       DESENHA A TRAMA
    ========================================== */

    function desenharTrama(tempoAtual) {

        ctx.clearRect(
            0,
            0,
            largura,
            altura
        );


        const linhas = 12;

        const espacamento =
            altura /
            (linhas + 1);


        ctx.lineWidth = 0.45;


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
                x += 12
            ) {

                const onda =
                    Math.sin(
                        x * 0.012 +
                        tempoAtual * 0.35 +
                        i
                    ) * 3;


                const y =
                    baseY +
                    onda;


                if (x === 0) {

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


            ctx.strokeStyle =
                'rgba(17,17,17,.08)';

            ctx.stroke();

        }


        const colunas = 18;

        const espacamentoX =
            largura /
            (colunas + 1);


        for (
            let i = 1;
            i <= colunas;
            i++
        ) {

            const baseX =
                espacamentoX * i;


            ctx.beginPath();


            for (
                let y = 0;
                y <= altura;
                y += 12
            ) {

                const onda =
                    Math.sin(
                        y * 0.014 +
                        tempoAtual * 0.25 +
                        i
                    ) * 3;


                const x =
                    baseX +
                    onda;


                if (y === 0) {

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


            ctx.strokeStyle =
                'rgba(17,17,17,.045)';

            ctx.stroke();

        }

    }


    /* ==========================================
       DESENHA TUDO
    ========================================== */

    function desenhar(tempoAtual) {

        desenharTrama(
            tempoAtual
        );


        fios.forEach(
            fio => {

                desenharFio(
                    fio,
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
                18,
                0,
                Math.PI * 2
            );


            ctx.strokeStyle =
                'rgba(17,17,17,.12)';

            ctx.lineWidth = 1;

            ctx.stroke();

        }

    }


    /* ==========================================
       VERIFICA SE O CURSOR PEGOU UM FIO
    ========================================== */

    function verificarColeta() {

        if (
            !mouse.ativo ||
            terminou
        ) {

            return;

        }


        fios.forEach(
            fio => {

                if (fio.coletado) {
                    return;
                }


                const dx =
                    mouse.x -
                    fio.x;


                const dy =
                    mouse.y -
                    fio.y;


                const distancia =
                    Math.sqrt(
                        dx * dx +
                        dy * dy
                    );


                if (
                    distancia < 28
                ) {

                    fio.coletado =
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


    /* ==========================================
       INICIA O JOGO
    ========================================== */

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


    /* ==========================================
       FINALIZA
    ========================================== */

    function finalizar(vitoria) {

        terminou = true;

        iniciado = false;


        if (vitoria) {

            mensagemTexto.innerHTML =
                'a trama está completa.<br>' +
                'você recolheu todos os fios.';

        } else {

            mensagemTexto.innerHTML =
                'o tempo acabou.<br>' +
                'a trama ficou incompleta.';

        }


        mensagem.classList.add(
            'visivel'
        );

    }


    /* ==========================================
       ATUALIZA O TEMPO
    ========================================== */

    function atualizarTempo(agora) {

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


    /* ==========================================
       LOOP PRINCIPAL
    ========================================== */

    function animar(agora) {

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


    /* ==========================================
       MOUSE
    ========================================== */

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


    /* ==========================================
       REDIMENSIONAMENTO
    ========================================== */

    window.addEventListener(
        'resize',
        () => {

            tamanhoCanvas();

            criarFios();

        }
    );


    /* ==========================================
       REINICIAR
    ========================================== */

    reiniciar.addEventListener(
        'click',
        iniciar
    );


    /* ==========================================
       INICIALIZAÇÃO
    ========================================== */

    tamanhoCanvas();

    criarFios();

    iniciar();

    requestAnimationFrame(
        animar
    );

})();
