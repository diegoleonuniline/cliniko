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

modal.addEventListener('click', function(e) {
    if (e.target === modal) {
        cerrarModal();
    }
});

// =============================================
// CONFETTI
// =============================================
function lanzarConfetti() {
    const ctx = confettiCanvas.getContext('2d');
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
    
    const particulas = [];
    const colores = ['#0A4D68', '#088395', '#05BFDB', '#00FFCA', '#FFD700', '#FF6B6B', '#A855F7'];
    
    for (let i = 0; i < 200; i++) {
        particulas.push({
            x: Math.random() * confettiCanvas.width,
            y: -20 - Math.random() * 200,
            size: Math.random() * 12 + 6,
            color: colores[Math.floor(Math.random() * colores.length)],
            speedY: Math.random() * 3 + 2,
            speedX: (Math.random() - 0.5) * 6,
            rotation: Math.random() * 360,
            rotationSpeed: (Math.random() - 0.5) * 15
        });
    }
    
    function animate() {
        ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
        
        let activas = 0;
        
        particulas.forEach(p => {
            if (p.y < confettiCanvas.height + 50) {
                activas++;
                
                p.y += p.speedY;
                p.x += p.speedX;
                p.rotation += p.rotationSpeed;
                p.speedY += 0.12;
                p.speedX *= 0.99;
                
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation * Math.PI / 180);
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.size/2, -p.size/4, p.size, p.size/2);
                ctx.restore();
            }
        });
        
        if (activas > 0) {
            requestAnimationFrame(animate);
        } else {
            ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
        }
    }
    
    animate();
}

// =============================================
// RESIZE
// =============================================
window.addEventListener('resize', () => {
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
});
