
        const circle     = document.getElementById('circle');
        const bgFill     = document.getElementById('bgFill');
        const content    = document.getElementById('splashContent');

        const frames = [
            { scale: 0,   duration: 50   },  
            { scale: 1,   duration: 650 },   
            { scale: 2.5, duration: 880 },  
            { scale: 5,   duration: 990 },   
            { scale: 1,   duration: 320 },  
            { scale: 0,   duration: 1550 },   
        ];

        let currentFrame = 0;

        function runFrame() {
            currentFrame++;
            if (currentFrame >= frames.length) return;

            const f = frames[currentFrame];

            if (currentFrame === frames.length - 1) {
                circle.style.transition = 'transform 0.28s ease-in, opacity 0.28s ease-in';
                circle.style.opacity = '0';
                circle.style.transform = `translate(-50%, -50%) scale(0)`;

                setTimeout(() => {
                    bgFill.style.opacity = '1';
                    setTimeout(() => {
                        content.style.opacity = '1';
                        setTimeout(() => {
                            window.location.href = '/LANDING PAGE/land.html';
                        }, 4000);
                    }, 200);
                }, 180);
                return;
            }

            circle.style.transition = `transform ${f.duration}ms cubic-bezier(0.34, 1.4, 0.64, 1)`;
            circle.style.transform  = `translate(-50%, -50%) scale(${f.scale})`;

            setTimeout(runFrame, f.duration + 60);
        }
        setTimeout(runFrame, 300);