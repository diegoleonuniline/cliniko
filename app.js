// =============================================
// API - Tu Cloudflare Worker
// =============================================
const API = 'https://yellow-pond-ca9a.diego-leon.workers.dev';

// =============================================
// ELEMENTOS
// =============================================
const form = document.getElementById('formCliente');
const btn = document.getElementById('btnEnviar');
const mensaje = document.getElementById('mensaje');
const modal = document.getElementById('modalOverlay');
const modalDetails = document.getElementById('modalDetails');
const confettiCanvas = document.getElementById('confetti');

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
            select.innerHTML += `<option value="${s.ID}" data-nombre="${s.Nombre}" data-precio="${s.Precio}">${s.Nombre} - $${s.Precio}</option>`;
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
    mensaje.className = 'mensaje';
    
    const selectServicio = document.getElementById('motivoVisita');
    const servicioSeleccionado = selectServicio.options[selectServicio.selectedIndex];
    
    const datos = {
        Nombre: document.getElementById('nombre').value,
        Teléfono: document.getElementById('telefono').value,
        Email: document.getElementById('email').value,
        FechaNacimiento: document.getElementById('fechaNacimiento').value || '',
      Sexo: document.querySelector('input[name="sexo"]:checked') ? document.querySelector('input[name="sexo"]:checked').value : '',
        'Motivo de Visita': document.getElementById('motivoVisita').value,
        Notas: document.getElementById('notas').value || '',
        FechaRegistro: new Date().toLocaleDateString('en-US')
    };
    
    try {
        await agregarCliente(datos);
        
        // Mostrar modal de éxito
        modalDetails.innerHTML = `
            <div><span>Paciente</span><span>${datos.Nombre}</span></div>
            <div><span>Teléfono</span><span>${datos.Teléfono}</span></div>
            <div><span>Servicio</span><span>${servicioSeleccionado.dataset.nombre}</span></div>
        `;
        
        modal.classList.add('active');
        lanzarConfetti();
        
        form.reset();
        cargarServicios();
        
    } catch (error) {
        console.error('❌ Error:', error);
        mensaje.className = 'mensaje error';
        mensaje.textContent = '❌ Error al registrar. Intenta de nuevo.';
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

// =============================================
// CONFETTI
// =============================================
function lanzarConfetti() {
    const ctx = confettiCanvas.getContext('2d');
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
    
    const particles = [];
    const colors = ['#00d9ff', '#00ff88', '#ff6b6b', '#ffd93d', '#6c5ce7', '#a29bfe'];
    
    for (let i = 0; i < 150; i++) {
        particles.push({
            x: Math.random() * confettiCanvas.width,
            y: -20 - Math.random() * 100,
            size: Math.random() * 8 + 4,
            color: colors[Math.floor(Math.random() * colors.length)],
            speedY: Math.random() * 3 + 2,
            speedX: (Math.random() - 0.5) * 4,
            rotation: Math.random() * 360,
            rotationSpeed: (Math.random() - 0.5) * 10
        });
    }
    
    function animate() {
        ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
        
        let activas = 0;
        
        particles.forEach(p => {
            if (p.y < confettiCanvas.height + 20) {
                activas++;
                p.y += p.speedY;
                p.x += p.speedX;
                p.rotation += p.rotationSpeed;
                p.speedY += 0.1;
                
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation * Math.PI / 180);
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
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

// =============================================
// INICIAR
// =============================================
cargarServicios();
