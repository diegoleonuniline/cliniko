// =============================================
// API - Tu Cloudflare Worker
// =============================================
const API = 'https://yellow-pond-ca9a.diego-leon.workers.dev';

// =============================================
// ELEMENTOS
// =============================================
const form = document.getElementById('formCliente');
const btn = document.getElementById('btnEnviar');
const modal = document.getElementById('modalOverlay');
const modalDetails = document.getElementById('modalDetails');
const confettiCanvas = document.getElementById('confetti');
const particles = document.getElementById('particles');

// =============================================
// INICIAR
// =============================================
document.addEventListener('DOMContentLoaded', () => {
    cargarServicios();
    crearParticulas();
});

// =============================================
// PARTÍCULAS FLOTANTES
// =============================================
function crearParticulas() {
    for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.width = Math.random() * 15 + 5 + 'px';
        particle.style.height = particle.style.width;
        particle.style.animationDelay = Math.random() * 15 + 's';
        particle.style.animationDuration = Math.random() * 10 + 15 + 's';
        particles.appendChild(particle);
    }
}

// =============================================
// CARGAR SERVICIOS
// =============================================
async function cargarServicios() {
    try {
        const res = await fetch(API + '/servicios');
        const servicios = await res.json();
        
        const select = document.getElementById('motivoVisita');
        select.innerHTML = '<option value="">Seleccionar servicio...</option>';
        
        servicios.forEach(s => {
            const option = document.createElement('option');
            option.value = s.ID;
            option.textContent = s.Nombre + (s.Precio ? ' - $' + s.Precio : '');
            option.dataset.nombre = s.Nombre;
            option.dataset.precio = s.Precio || '';
            select.appendChild(option);
        });
        
        console.log('✅ Servicios cargados:', servicios.length);
    } catch (error) {
        console.error('❌ Error cargando servicios:', error);
    }
}

// =============================================
// AGREGAR CLIENTE
// =============================================
async function agregarCliente(datos) {
    const res = await fetch(API + '/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
    });
    
    if (!res.ok) throw new Error('Error al guardar');
    
    return await res.json();
}

// =============================================
// FORMULARIO
// =============================================
form.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    btn.disabled = true;
    btn.classList.add('loading');
    
    const selectServicio = document.getElementById('motivoVisita');
    const opcionSeleccionada = selectServicio.options[selectServicio.selectedIndex];
    
    // Obtener sexo de forma segura
    const sexoInput = document.querySelector('input[name="sexo"]:checked');
    const sexoValue = sexoInput ? sexoInput.value : '';
    
    const datos = {
        Nombre: document.getElementById('nombre').value,
        Teléfono: document.getElementById('telefono').value,
        Email: document.getElementById('email').value,
        FechaNacimiento: document.getElementById('fechaNacimiento').value || '',
        Sexo: sexoValue,
        'Motivo de Visita': document.getElementById('motivoVisita').value,
        Notas: document.getElementById('notas').value || '',
        FechaRegistro: new Date().toLocaleDateString('en-US')
    };
    
    try {
        await agregarCliente(datos);
        
        // Mostrar modal
        modalDetails.innerHTML = `
            <div><span>Paciente</span><span>${datos.Nombre}</span></div>
            <div><span>Teléfono</span><span>${datos.Teléfono}</span></div>
            <div><span>Servicio</span><span>${opcionSeleccionada.dataset.nombre || 'N/A'}</span></div>
        `;
        
        modal.classList.add('active');
        lanzarConfetti();
        
        form.reset();
        cargarServicios();
        
        console.log('✅ Cliente guardado');
        
    } catch (error) {
        console.error('❌ Error:', error);
        alert('Error al registrar. Intenta de nuevo.');
    }
    
    btn.disabled = false;
    btn.classList.remove('loading');
});

// =============================================
// CERRAR MODAL
// =============================================
function cerrarModal() {
    modal.classList.remove('active');
}

// Click fuera del modal para cerrar
modal.addEventListener('click', function(e) {
    if (e.target === modal) {
        cerrarModal();
    }
});

// =============================================
// CONFETTI PREMIUM
// =============================================
function lanzarConfetti() {
    const ctx = confettiCanvas.getContext('2d');
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
    
    const particulas = [];
    const colores = ['#0A4D68', '#088395', '#05BFDB', '#00FFCA', '#FFD700', '#FF6B6B', '#A855F7', '#34D399'];
    const formas = ['rect', 'circle', 'triangle', 'star'];
    
    // Crear partículas
    for (let i = 0; i < 200; i++) {
        particulas.push({
            x: Math.random() * confettiCanvas.width,
            y: -20 - Math.random() * 200,
            size: Math.random() * 12 + 6,
            color: colores[Math.floor(Math.random() * colores.length)],
            forma: formas[Math.floor(Math.random() * formas.length)],
            speedY: Math.random() * 3 + 2,
            speedX: (Math.random() - 0.5) * 6,
            rotation: Math.random() * 360,
            rotationSpeed: (Math.random() - 0.5) * 15,
            oscillation: Math.random() * Math.PI * 2,
            oscillationSpeed: Math.random() * 0.1
        });
    }
    
    function dibujarForma(ctx, p) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation * Math.PI / 180);
        ctx.fillStyle = p.color;
        
        switch(p.forma) {
            case 'rect':
                ctx.fillRect(-p.size/2, -p.size/4, p.size, p.size/2);
                break;
            case 'circle':
                ctx.beginPath();
                ctx.arc(0, 0, p.size/2, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'triangle':
                ctx.beginPath();
                ctx.moveTo(0, -p.size/2);
                ctx.lineTo(p.size/2, p.size/2);
                ctx.lineTo(-p.size/2, p.size/2);
                ctx.closePath();
                ctx.fill();
                break;
            case 'star':
                dibujarEstrella(ctx, 0, 0, 5, p.size/2, p.size/4);
                ctx.fill();
                break;
        }
        
        ctx.restore();
    }
    
    function dibujarEstrella(ctx, cx, cy, spikes, outerRadius, innerRadius) {
        let rot = Math.PI / 2 * 3;
        let x = cx;
        let y = cy;
        let step = Math.PI / spikes;
        
        ctx.beginPath();
        ctx.moveTo(cx, cy - outerRadius);
        
        for (let i = 0; i < spikes; i++) {
            x = cx + Math.cos(rot) * outerRadius;
            y = cy + Math.sin(rot) * outerRadius;
            ctx.lineTo(x, y);
            rot += step;
            
            x = cx + Math.cos(rot) * innerRadius;
            y = cy + Math.sin(rot) * innerRadius;
            ctx.lineTo(x, y);
            rot += step;
        }
        
        ctx.lineTo(cx, cy - outerRadius);
        ctx.closePath();
    }
    
    function animate() {
        ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
        
        let activas = 0;
        
        particulas.forEach(p => {
            if (p.y < confettiCanvas.height + 50) {
                activas++;
                
                // Física
                p.y += p.speedY;
                p.x += p.speedX + Math.sin(p.oscillation) * 2;
                p.rotation += p.rotationSpeed;
                p.speedY += 0.12; // Gravedad
                p.speedX *= 0.99; // Fricción
                p.oscillation += p.oscillationSpeed;
                
                dibujarForma(ctx, p);
            }
        });
        
        if (activas > 0) {
            requestAnimationFrame(animate);
        } else {
            ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
        }
    }
    
    animate();
    
    // Sonido de celebración (opcional)
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        oscillator.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
        oscillator.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1); // E5
        oscillator.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.2); // G5
        
        gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
        
        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 0.5);
    } catch(e) {}
}

// =============================================
// RESIZE
// =============================================
window.addEventListener('resize', () => {
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
});
