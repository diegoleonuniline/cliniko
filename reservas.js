// =============================================
// API - Tu Cloudflare Worker
// =============================================
const API = 'https://yellow-pond-ca9a.diego-leon.workers.dev';

// =============================================
// VARIABLES GLOBALES
// =============================================
let datos = { servicios: [], doctores: [], sucursales: [], configuracion: {}, citas: [] };
let reserva = {
    servicios: [],
    doctor: null,
    sucursal: null,
    fecha: null,
    hora: null,
    nombre: '',
    telefono: '',
    email: '',
    notas: ''
};
let pasoActual = 1;
let mesActual = new Date();
let categoriaActiva = 'todas';

// =============================================
// ELEMENTOS DOM
// =============================================
const loadingOverlay = document.getElementById('loadingOverlay');
const confettiCanvas = document.getElementById('confetti');

// =============================================
// INICIALIZAR
// =============================================
document.addEventListener('DOMContentLoaded', init);

async function init() {
    try {
        const res = await fetch(API + '/datos-reservas');
        datos = await res.json();
        
        document.getElementById('totalConsultorios').textContent = datos.sucursales.length || 1;
        
        renderCategorias();
        renderServicios();
        renderConsultorios();
        renderDoctores();
        renderCalendario();
        
        loadingOverlay.style.display = 'none';
        showToast('success', '¡Bienvenido!', 'Selecciona los servicios que necesitas');
        
    } catch (error) {
        console.error('Error:', error);
        loadingOverlay.innerHTML = '<p style="color:#EF4444;">Error al cargar. Recarga la página.</p>';
    }
}

// =============================================
// TOAST
// =============================================
function showToast(type, title, message) {
    const container = document.getElementById('toastContainer');
    const icons = { success: '✓', error: '✕', warning: '⚠' };
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-icon">${icons[type]}</div>
        <div class="toast-content">
            <h4>${title}</h4>
            <p>${message}</p>
        </div>
    `;
    
    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// =============================================
// CATEGORÍAS
// =============================================
function renderCategorias() {
    const categorias = {};
    datos.servicios.forEach(s => {
        const cat = s.categoria || 'General';
        categorias[cat] = (categorias[cat] || 0) + 1;
    });
    
    const container = document.getElementById('categoriaFiltros');
    let html = `<div class="filtro-cat active" onclick="filtrarCategoria('todas')">
        🌟 Todas <span class="filtro-badge">${datos.servicios.length}</span>
    </div>`;
    
    Object.entries(categorias).forEach(([cat, count]) => {
        html += `<div class="filtro-cat" onclick="filtrarCategoria('${cat}')">
            ${getIconoCategoria(cat)} ${cat} <span class="filtro-badge">${count}</span>
        </div>`;
    });
    
    container.innerHTML = html;
}

function getIconoCategoria(cat) {
    const iconos = {
        'Corte': '✂️', 'Consulta': '🩺', 'Diagnóstico': '🔬', 'Tratamiento': '💊',
        'Diálisis': '🏥', 'General': '📋', 'Estudio': '📊', 'Control': '📈'
    };
    return iconos[cat] || '📋';
}

function filtrarCategoria(cat) {
    categoriaActiva = cat;
    document.querySelectorAll('.filtro-cat').forEach(el => {
        el.classList.toggle('active', 
            (cat === 'todas' && el.textContent.includes('Todas')) || 
            el.textContent.includes(cat)
        );
    });
    filtrarServicios();
}

// =============================================
// SERVICIOS
// =============================================
function renderServicios() {
    const container = document.getElementById('serviciosGrid');
    container.innerHTML = datos.servicios.map(s => `
        <div class="servicio-card" data-id="${s.id}" data-cat="${s.categoria || 'General'}" onclick="toggleServicio('${s.id}')">
            <div class="servicio-check">✓</div>
            <div class="servicio-header">
                <div class="servicio-info">
                    <h5>${s.nombre}</h5>
                    <div class="servicio-cat">${s.categoria || 'General'}</div>
                </div>
                <div class="servicio-precio">$${s.precio}</div>
            </div>
            <div class="servicio-meta">
                <span>⏱️ ${s.duracion} min</span>
            </div>
        </div>
    `).join('');
}

function filtrarServicios() {
    const busqueda = document.getElementById('searchServicios').value.toLowerCase();
    
    document.querySelectorAll('.servicio-card').forEach(card => {
        const nombre = card.querySelector('h5').textContent.toLowerCase();
        const cat = card.dataset.cat;
        
        const matchBusqueda = !busqueda || nombre.includes(busqueda);
        const matchCat = categoriaActiva === 'todas' || cat === categoriaActiva;
        
        card.classList.toggle('hidden', !(matchBusqueda && matchCat));
    });
}

function toggleServicio(id) {
    const servicio = datos.servicios.find(s => s.id === id);
    const idx = reserva.servicios.findIndex(s => s.id === id);
    
    if (idx > -1) {
        reserva.servicios.splice(idx, 1);
    } else {
        reserva.servicios.push(servicio);
    }
    
    document.querySelectorAll('.servicio-card').forEach(card => {
        card.classList.toggle('selected', reserva.servicios.some(s => s.id === card.dataset.id));
    });
    
    actualizarSeleccionados();
}

function actualizarSeleccionados() {
    const container = document.getElementById('serviciosSeleccionados');
    const tags = document.getElementById('serviciosTags');
    
    if (!reserva.servicios.length) {
        container.style.display = 'none';
        return;
    }
    
    container.style.display = 'block';
    tags.innerHTML = reserva.servicios.map(s => `
        <span class="tag">
            ${s.nombre}
            <span class="tag-remove" onclick="event.stopPropagation(); toggleServicio('${s.id}')">✕</span>
        </span>
    `).join('');
    
    const total = reserva.servicios.reduce((sum, s) => sum + s.precio, 0);
    const duracion = reserva.servicios.reduce((sum, s) => sum + s.duracion, 0);
    
    document.getElementById('totalPrecio').textContent = '$' + total;
    document.getElementById('totalDuracion').textContent = duracion + ' min';
}

// =============================================
// CONSULTORIOS
// =============================================
function renderConsultorios() {
    const container = document.getElementById('consultoriosGrid');
    container.innerHTML = datos.sucursales.map(s => `
        <div class="selection-item" data-id="${s.nombre}" onclick="selectConsultorio('${s.nombre}')">
            <div class="selection-check">✓</div>
            <h3>${s.nombre}</h3>
            <p>${s.direccion || ''}</p>
            ${s.telefono ? `<div class="selection-meta"><span>📞 ${s.telefono}</span></div>` : ''}
        </div>
    `).join('');
}

function selectConsultorio(nombre) {
    reserva.sucursal = nombre;
    reserva.fecha = null;
    reserva.hora = null;
    document.getElementById('btnPaso3').disabled = true;
    
    document.querySelectorAll('#consultoriosGrid .selection-item').forEach(el => {
        el.classList.toggle('selected', el.dataset.id === nombre);
    });
}

// =============================================
// DOCTORES
// =============================================
function renderDoctores() {
    const container = document.getElementById('doctoresGrid');
    container.innerHTML = datos.doctores.map(d => {
        const iniciales = d.nombre.split(' ').map(n => n[0]).join('').substring(0, 2);
        return `
            <div class="selection-item" data-id="${d.nombre}" onclick="selectDoctor('${d.nombre}')">
                <div class="selection-check">✓</div>
                <div style="display:flex;align-items:center;gap:12px;">
                    <div style="width:50px;height:50px;border-radius:50%;background:linear-gradient(135deg,#0A4D68,#05BFDB);display:flex;align-items:center;justify-content:center;color:white;font-weight:700;">${iniciales}</div>
                    <div>
                        <h3>${d.nombre}</h3>
                        <p>${d.especialidad || 'Especialista'}</p>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function selectDoctor(nombre) {
    reserva.doctor = nombre;
    reserva.hora = null;
    document.getElementById('btnPaso3').disabled = true;
    
    document.querySelectorAll('#doctoresGrid .selection-item').forEach(el => {
        el.classList.toggle('selected', el.dataset.id === nombre);
    });
    
    if (reserva.fecha) cargarDisponibilidad();
}

// =============================================
// CALENDARIO
// =============================================
function renderCalendario() {
    const hoy = new Date();
    const primerDia = new Date(mesActual.getFullYear(), mesActual.getMonth(), 1);
    const ultimoDia = new Date(mesActual.getFullYear(), mesActual.getMonth() + 1, 0);
    
    const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    document.getElementById('calendarioMes').textContent = meses[mesActual.getMonth()] + ' ' + mesActual.getFullYear();
    
    let html = '';
    
    // Días vacíos al inicio
    for (let i = 0; i < primerDia.getDay(); i++) {
        html += '<div class="dia otro-mes"></div>';
    }
    
    // Días del mes
    for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
        const fecha = new Date(mesActual.getFullYear(), mesActual.getMonth(), dia);
        const fechaStr = fecha.toISOString().split('T')[0];
        const esHoy = fecha.toDateString() === hoy.toDateString();
        const esPasado = fecha < new Date(hoy.setHours(0,0,0,0));
        
        let clases = 'dia';
        if (esHoy) clases += ' today';
        if (esPasado) clases += ' disabled';
        if (fechaStr === reserva.fecha) clases += ' selected';
        
        html += `<div class="${clases}" onclick="${esPasado ? '' : "selectFecha('" + fechaStr + "')"}">${dia}</div>`;
    }
    
    document.getElementById('calendarioDias').innerHTML = html;
}

function cambiarMes(dir) {
    mesActual.setMonth(mesActual.getMonth() + dir);
    renderCalendario();
}

function selectFecha(fechaStr) {
    reserva.fecha = fechaStr;
    reserva.hora = null;
    document.getElementById('btnPaso3').disabled = true;
    
    renderCalendario();
    
    const fecha = new Date(fechaStr + 'T12:00:00');
    document.getElementById('fechaSeleccionadaLabel').textContent = fecha.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
    
    cargarDisponibilidad();
}

// =============================================
// DISPONIBILIDAD
// =============================================
async function cargarDisponibilidad() {
    const grid = document.getElementById('horariosGrid');
    grid.innerHTML = '<div class="horarios-empty"><div class="loading-spinner" style="width:30px;height:30px;margin:0 auto 10px;"></div><p>Cargando horarios...</p></div>';
    
    try {
        const duracionTotal = reserva.servicios.reduce((sum, s) => sum + s.duracion, 0);
        
        const res = await fetch(API + '/disponibilidad', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fecha: reserva.fecha,
                doctorId: reserva.doctor,
                sucursalId: reserva.sucursal,
                duracionTotal: duracionTotal
            })
        });
        
        const slots = await res.json();
        renderHorarios(slots);
        
    } catch (error) {
        console.error('Error:', error);
        grid.innerHTML = '<div class="horarios-empty"><p>Error al cargar horarios</p></div>';
    }
}

function renderHorarios(slots) {
    const grid = document.getElementById('horariosGrid');
    
    if (!slots || !slots.length) {
        grid.innerHTML = '<div class="horarios-empty"><p>No hay horarios disponibles</p></div>';
        return;
    }
    
    grid.innerHTML = slots.map(s => `
        <div class="horario ${s.disponible ? '' : 'disabled'} ${s.hora === reserva.hora ? 'selected' : ''}" 
             onclick="${s.disponible ? "selectHora('" + s.hora + "')" : ''}">
            ${s.hora}
        </div>
    `).join('');
}

function selectHora(hora) {
    reserva.hora = hora;
    document.getElementById('btnPaso3').disabled = false;
    
    document.querySelectorAll('.horario').forEach(el => {
        el.classList.toggle('selected', el.textContent.trim() === hora);
    });
}

// =============================================
// NAVEGACIÓN PASOS
// =============================================
function siguientePaso() {
    // Validaciones
    if (pasoActual === 1 && !reserva.servicios.length) {
        showToast('warning', 'Atención', 'Selecciona al menos un servicio');
        return;
    }
    if (pasoActual === 2 && (!reserva.sucursal || !reserva.doctor)) {
        showToast('warning', 'Atención', 'Selecciona consultorio y doctor');
        return;
    }
    if (pasoActual === 3 && (!reserva.fecha || !reserva.hora)) {
        showToast('warning', 'Atención', 'Selecciona fecha y hora');
        return;
    }
    if (pasoActual === 4) {
        reserva.nombre = document.getElementById('inputNombre').value.trim();
        reserva.telefono = document.getElementById('inputTelefono').value.trim();
        reserva.email = document.getElementById('inputEmail').value.trim();
        reserva.notas = document.getElementById('inputNotas').value.trim();
        
        if (!reserva.nombre) {
            showToast('warning', 'Campo requerido', 'Ingresa tu nombre');
            return;
        }
        if (!reserva.telefono || reserva.telefono.length < 10) {
            showToast('warning', 'Campo requerido', 'Ingresa teléfono válido (10 dígitos)');
            return;
        }
        if (!reserva.email || !reserva.email.includes('@')) {
            showToast('warning', 'Campo requerido', 'Ingresa email válido');
            return;
        }
        
        actualizarResumen();
    }
    
    pasoActual++;
    mostrarPaso();
}

function anteriorPaso() {
    pasoActual--;
    mostrarPaso();
}

function mostrarPaso() {
    // Ocultar todos los pasos
    document.querySelectorAll('.paso').forEach(p => p.classList.remove('active'));
    document.getElementById('paso' + pasoActual).classList.add('active');
    
    // Actualizar stepper
    document.querySelectorAll('.step').forEach((s, i) => {
        s.classList.remove('active', 'completed');
        if (i + 1 < pasoActual) s.classList.add('completed');
        if (i + 1 === pasoActual) s.classList.add('active');
    });
    
    window.scrollTo({ top: 200, behavior: 'smooth' });
}

// =============================================
// RESUMEN
// =============================================
function actualizarResumen() {
    const fecha = new Date(reserva.fecha + 'T12:00:00');
    const duracion = reserva.servicios.reduce((sum, s) => sum + s.duracion, 0);
    const total = reserva.servicios.reduce((sum, s) => sum + s.precio, 0);
    
    document.getElementById('resumenFecha').textContent = fecha.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' });
    document.getElementById('resumenHora').textContent = reserva.hora;
    document.getElementById('resumenDuracion').textContent = duracion + ' minutos';
    document.getElementById('resumenConsultorio').textContent = reserva.sucursal;
    document.getElementById('resumenDoctor').textContent = reserva.doctor;
    document.getElementById('resumenServicios').textContent = reserva.servicios.map(s => s.nombre).join(', ');
    document.getElementById('resumenNombre').textContent = reserva.nombre;
    document.getElementById('resumenTelefono').textContent = reserva.telefono;
    document.getElementById('resumenEmail').textContent = reserva.email;
    document.getElementById('resumenTotal').textContent = '$' + total;
}

// =============================================
// CONFIRMAR RESERVA
// =============================================
async function confirmarReserva() {
    const btn = document.getElementById('btnConfirmar');
    btn.disabled = true;
    btn.innerHTML = '<div class="loading-spinner" style="width:20px;height:20px;margin:0;border-width:2px;"></div> Procesando...';
    
    try {
        const res = await fetch(API + '/reservar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                servicios: reserva.servicios,
                doctor: reserva.doctor,
                sucursal: reserva.sucursal,
                fecha: reserva.fecha,
                horaInicio: reserva.hora,
                nombre: reserva.nombre,
                telefono: reserva.telefono,
                email: reserva.email,
                notas: reserva.notas
            })
        });
        
        const resultado = await res.json();
        
        if (resultado.success) {
            // Mostrar éxito
            document.getElementById('exitoFolio').textContent = resultado.folio;
            document.getElementById('exitoFechaHora').textContent = resultado.fecha + ' ' + resultado.hora;
            document.getElementById('exitoConsultorio').textContent = resultado.sucursal;
            document.getElementById('exitoDoctor').textContent = resultado.doctor;
            
            document.querySelectorAll('.paso').forEach(p => p.classList.remove('active'));
            document.getElementById('pasoExito').classList.add('active');
            document.querySelectorAll('.step').forEach(s => s.classList.add('completed'));
            
            lanzarConfetti();
            showToast('success', '¡Listo!', 'Tu cita ha sido reservada');
            
        } else {
            showToast('error', 'Error', resultado.error || 'No se pudo completar la reserva');
            btn.disabled = false;
            btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> Confirmar Reserva';
        }
        
    } catch (error) {
        console.error('Error:', error);
        showToast('error', 'Error', 'Error de conexión');
        btn.disabled = false;
        btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> Confirmar Reserva';
    }
}

// =============================================
// NUEVA RESERVA
// =============================================
function nuevaReserva() {
    reserva = {
        servicios: [],
        doctor: null,
        sucursal: null,
        fecha: null,
        hora: null,
        nombre: '',
        telefono: '',
        email: '',
        notas: ''
    };
    
    pasoActual = 1;
    categoriaActiva = 'todas';
    mesActual = new Date();
    
    // Reset UI
    document.querySelectorAll('.selection-item, .servicio-card').forEach(el => el.classList.remove('selected'));
    document.getElementById('serviciosSeleccionados').style.display = 'none';
    document.getElementById('searchServicios').value = '';
    document.getElementById('inputNombre').value = '';
    document.getElementById('inputTelefono').value = '';
    document.getElementById('inputEmail').value = '';
    document.getElementById('inputNotas').value = '';
    document.getElementById('btnPaso3').disabled = true;
    document.getElementById('fechaSeleccionadaLabel').textContent = 'Selecciona fecha';
    document.getElementById('horariosGrid').innerHTML = '<div class="horarios-empty"><span>👆</span><p>Selecciona una fecha para ver horarios</p></div>';
    
    renderCalendario();
    renderCategorias();
    filtrarServicios();
    mostrarPaso();
}

// =============================================
// CONFETTI
// =============================================
function lanzarConfetti() {
    const ctx = confettiCanvas.getContext('2d');
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
    
    const particulas = [];
    const colores = ['#0A4D68', '#088395', '#05BFDB', '#00FFCA', '#FFD700', '#10B981'];
    
    for (let i = 0; i < 200; i++) {
        particulas.push({
            x: Math.random() * confettiCanvas.width,
            y: -20 - Math.random() * 200,
            size: Math.random() * 10 + 5,
            color: colores[Math.floor(Math.random() * colores.length)],
            speedY: Math.random() * 3 + 2,
            speedX: (Math.random() - 0.5) * 5,
            rotation: Math.random() * 360,
            rotationSpeed: (Math.random() - 0.5) * 10
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
                p.speedY += 0.1;
                
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
https://resonant-griffin-f11430.netlify.app/reservas.html
