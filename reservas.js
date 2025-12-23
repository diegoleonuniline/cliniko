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
        
        document.getElementById('loadingOverlay').style.display = 'none';
        showToast('success', '¡Bienvenido!', 'Selecciona los servicios que necesitas');
        
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('loadingOverlay').innerHTML = '<p style="color:#EF4444;">Error al cargar. Recarga la página.</p>';
    }
}

// =============================================
// TOAST
// =============================================
function showToast(type, title, message) {
    const container = document.getElementById('toastContainer');
    const icons = { success: '✓', error: '✕', warning: '⚠' };
    
    const toast = document.createElement('div');
    toast.className = 'toast ' + type;
    toast.innerHTML = '<div class="toast-icon">' + icons[type] + '</div><div class="toast-content"><h4>' + title + '</h4><p>' + message + '</p></div>';
    
    container.appendChild(toast);
    setTimeout(function() { toast.classList.add('show'); }, 10);
    setTimeout(function() {
        toast.classList.remove('show');
        setTimeout(function() { toast.remove(); }, 300);
    }, 4000);
}

// =============================================
// CATEGORÍAS
// =============================================
function renderCategorias() {
    var categorias = {};
    datos.servicios.forEach(function(s) {
        var cat = s.categoria || 'General';
        categorias[cat] = (categorias[cat] || 0) + 1;
    });
    
    var container = document.getElementById('categoriaFiltros');
    var html = '<div class="filtro-cat active" onclick="filtrarCategoria(\'todas\')">🌟 Todas <span class="filtro-badge">' + datos.servicios.length + '</span></div>';
    
    Object.keys(categorias).forEach(function(cat) {
        html += '<div class="filtro-cat" onclick="filtrarCategoria(\'' + cat + '\')">' + getIconoCategoria(cat) + ' ' + cat + ' <span class="filtro-badge">' + categorias[cat] + '</span></div>';
    });
    
    container.innerHTML = html;
}

function getIconoCategoria(cat) {
    var iconos = {
        'Corte': '✂️', 'Consulta': '🩺', 'Diagnóstico': '🔬', 'Tratamiento': '💊',
        'Diálisis': '🏥', 'General': '📋', 'Estudio': '📊', 'Control': '📈'
    };
    return iconos[cat] || '📋';
}

function filtrarCategoria(cat) {
    categoriaActiva = cat;
    document.querySelectorAll('.filtro-cat').forEach(function(el) {
        var isActive = (cat === 'todas' && el.textContent.includes('Todas')) || el.textContent.includes(cat);
        el.classList.toggle('active', isActive);
    });
    filtrarServicios();
}

// =============================================
// SERVICIOS
// =============================================
function renderServicios() {
    var container = document.getElementById('serviciosGrid');
    var html = '';
    datos.servicios.forEach(function(s) {
        html += '<div class="servicio-card" data-id="' + s.id + '" data-cat="' + (s.categoria || 'General') + '" onclick="toggleServicio(\'' + s.id + '\')">';
        html += '<div class="servicio-check">✓</div>';
        html += '<div class="servicio-header">';
        html += '<div class="servicio-info"><h5>' + s.nombre + '</h5><div class="servicio-cat">' + (s.categoria || 'General') + '</div></div>';
        html += '<div class="servicio-precio">$' + s.precio + '</div>';
        html += '</div>';
        html += '<div class="servicio-meta"><span>⏱️ ' + s.duracion + ' min</span></div>';
        html += '</div>';
    });
    container.innerHTML = html;
}

function filtrarServicios() {
    var busqueda = document.getElementById('searchServicios').value.toLowerCase();
    document.querySelectorAll('.servicio-card').forEach(function(card) {
        var nombre = card.querySelector('h5').textContent.toLowerCase();
        var cat = card.dataset.cat;
        var matchBusqueda = !busqueda || nombre.includes(busqueda);
        var matchCat = categoriaActiva === 'todas' || cat === categoriaActiva;
        card.classList.toggle('hidden', !(matchBusqueda && matchCat));
    });
}

function toggleServicio(id) {
    var servicio = datos.servicios.find(function(s) { return s.id === id; });
    var idx = reserva.servicios.findIndex(function(s) { return s.id === id; });
    
    if (idx > -1) {
        reserva.servicios.splice(idx, 1);
    } else {
        reserva.servicios.push(servicio);
    }
    
    document.querySelectorAll('.servicio-card').forEach(function(card) {
        var isSelected = reserva.servicios.some(function(s) { return s.id === card.dataset.id; });
        card.classList.toggle('selected', isSelected);
    });
    
    actualizarSeleccionados();
}

function actualizarSeleccionados() {
    var container = document.getElementById('serviciosSeleccionados');
    var tags = document.getElementById('serviciosTags');
    
    if (!reserva.servicios.length) {
        container.style.display = 'none';
        return;
    }
    
    container.style.display = 'block';
    var html = '';
    reserva.servicios.forEach(function(s) {
        html += '<span class="tag">' + s.nombre + ' <span class="tag-remove" onclick="event.stopPropagation(); toggleServicio(\'' + s.id + '\')">✕</span></span>';
    });
    tags.innerHTML = html;
    
    var total = 0;
    var duracion = 0;
    reserva.servicios.forEach(function(s) {
        total += s.precio;
        duracion += s.duracion;
    });
    
    document.getElementById('totalPrecio').textContent = '$' + total;
    document.getElementById('totalDuracion').textContent = duracion + ' min';
}

// =============================================
// CONSULTORIOS
// =============================================
function renderConsultorios() {
    var container = document.getElementById('consultoriosGrid');
    var html = '';
    datos.sucursales.forEach(function(s) {
        html += '<div class="selection-item" data-id="' + s.nombre + '" onclick="selectConsultorio(\'' + s.nombre + '\')">';
        html += '<div class="selection-check">✓</div>';
        html += '<h3>' + s.nombre + '</h3>';
        html += '<p>' + (s.direccion || '') + '</p>';
        if (s.telefono) html += '<div class="selection-meta"><span>📞 ' + s.telefono + '</span></div>';
        html += '</div>';
    });
    container.innerHTML = html;
}

function selectConsultorio(nombre) {
    reserva.sucursal = nombre;
    reserva.fecha = null;
    reserva.hora = null;
    document.getElementById('btnPaso3').disabled = true;
    
    document.querySelectorAll('#consultoriosGrid .selection-item').forEach(function(el) {
        el.classList.toggle('selected', el.dataset.id === nombre);
    });
}

// =============================================
// DOCTORES
// =============================================
function renderDoctores() {
    var container = document.getElementById('doctoresGrid');
    var html = '';
    datos.doctores.forEach(function(d) {
        var iniciales = d.nombre.split(' ').map(function(n) { return n[0]; }).join('').substring(0, 2);
        html += '<div class="selection-item" data-id="' + d.nombre + '" onclick="selectDoctor(\'' + d.nombre + '\')">';
        html += '<div class="selection-check">✓</div>';
        html += '<div style="display:flex;align-items:center;gap:12px;">';
        html += '<div style="width:50px;height:50px;border-radius:50%;background:linear-gradient(135deg,#0A4D68,#05BFDB);display:flex;align-items:center;justify-content:center;color:white;font-weight:700;">' + iniciales + '</div>';
        html += '<div><h3>' + d.nombre + '</h3><p>' + (d.especialidad || 'Especialista') + '</p></div>';
        html += '</div></div>';
    });
    container.innerHTML = html;
}

function selectDoctor(nombre) {
    reserva.doctor = nombre;
    reserva.hora = null;
    document.getElementById('btnPaso3').disabled = true;
    
    document.querySelectorAll('#doctoresGrid .selection-item').forEach(function(el) {
        el.classList.toggle('selected', el.dataset.id === nombre);
    });
    
    if (reserva.fecha) cargarDisponibilidad();
}

// =============================================
// CALENDARIO
// =============================================
function renderCalendario() {
    var hoy = new Date();
    var primerDia = new Date(mesActual.getFullYear(), mesActual.getMonth(), 1);
    var ultimoDia = new Date(mesActual.getFullYear(), mesActual.getMonth() + 1, 0);
    
    var meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    document.getElementById('calendarioMes').textContent = meses[mesActual.getMonth()] + ' ' + mesActual.getFullYear();
    
    var html = '';
    for (var i = 0; i < primerDia.getDay(); i++) {
        html += '<div class="dia otro-mes"></div>';
    }
    
    for (var dia = 1; dia <= ultimoDia.getDate(); dia++) {
        var fecha = new Date(mesActual.getFullYear(), mesActual.getMonth(), dia);
        var fechaStr = fecha.toISOString().split('T')[0];
        var esHoy = fecha.toDateString() === hoy.toDateString();
        var hoyReset = new Date(hoy);
        hoyReset.setHours(0,0,0,0);
        var esPasado = fecha < hoyReset;
        
        var clases = 'dia';
        if (esHoy) clases += ' today';
        if (esPasado) clases += ' disabled';
        if (fechaStr === reserva.fecha) clases += ' selected';
        
        if (esPasado) {
            html += '<div class="' + clases + '">' + dia + '</div>';
        } else {
            html += '<div class="' + clases + '" onclick="selectFecha(\'' + fechaStr + '\')">' + dia + '</div>';
        }
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
    
    var fecha = new Date(fechaStr + 'T12:00:00');
    document.getElementById('fechaSeleccionadaLabel').textContent = fecha.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
    
    cargarDisponibilidad();
}

// =============================================
// DISPONIBILIDAD
// =============================================
async function cargarDisponibilidad() {
    var grid = document.getElementById('horariosGrid');
    grid.innerHTML = '<div class="horarios-empty"><div class="loading-spinner" style="width:30px;height:30px;margin:0 auto 10px;"></div><p>Cargando...</p></div>';
    
    try {
        var duracionTotal = 0;
        reserva.servicios.forEach(function(s) { duracionTotal += s.duracion; });
        
        var res = await fetch(API + '/disponibilidad', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fecha: reserva.fecha,
                doctorId: reserva.doctor,
                sucursalId: reserva.sucursal,
                duracionTotal: duracionTotal
            })
        });
        
        var slots = await res.json();
        renderHorarios(slots);
        
    } catch (error) {
        console.error('Error:', error);
        grid.innerHTML = '<div class="horarios-empty"><p>Error al cargar</p></div>';
    }
}

function renderHorarios(slots) {
    var grid = document.getElementById('horariosGrid');
    
    if (!slots || !slots.length) {
        grid.innerHTML = '<div class="horarios-empty"><p>No hay horarios</p></div>';
        return;
    }
    
    var html = '';
    slots.forEach(function(s) {
        var clases = 'horario';
        if (!s.disponible) clases += ' disabled';
        if (s.hora === reserva.hora) clases += ' selected';
        
        if (s.disponible) {
            html += '<div class="' + clases + '" onclick="selectHora(\'' + s.hora + '\')">' + s.hora + '</div>';
        } else {
            html += '<div class="' + clases + '">' + s.hora + '</div>';
        }
    });
    grid.innerHTML = html;
}

function selectHora(hora) {
    reserva.hora = hora;
    document.getElementById('btnPaso3').disabled = false;
    
    document.querySelectorAll('.horario').forEach(function(el) {
        el.classList.toggle('selected', el.textContent.trim() === hora);
    });
}

// =============================================
// NAVEGACIÓN
// =============================================
function siguientePaso() {
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
        
        if (!reserva.nombre) { showToast('warning', 'Requerido', 'Ingresa tu nombre'); return; }
        if (!reserva.telefono || reserva.telefono.length < 10) { showToast('warning', 'Requerido', 'Teléfono válido'); return; }
        if (!reserva.email || !reserva.email.includes('@')) { showToast('warning', 'Requerido', 'Email válido'); return; }
        
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
    document.querySelectorAll('.paso').forEach(function(p) { p.classList.remove('active'); });
    document.getElementById('paso' + pasoActual).classList.add('active');
    
    document.querySelectorAll('.step').forEach(function(s, i) {
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
    var fechaObj = new Date(reserva.fecha + 'T12:00:00');
    var opciones = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    var fechaBonita = fechaObj.toLocaleDateString('es-MX', opciones);
    fechaBonita = fechaBonita.charAt(0).toUpperCase() + fechaBonita.slice(1);

    var duracion = 0;
    var total = 0;
    reserva.servicios.forEach(function(s) { duracion += s.duracion; total += s.precio; });

    document.getElementById('resumenFecha').textContent = fechaBonita;
    document.getElementById('resumenHora').textContent = reserva.hora + ' hrs';
    document.getElementById('resumenDuracion').textContent = duracion + ' minutos';
    document.getElementById('resumenConsultorio').textContent = reserva.sucursal;
    document.getElementById('resumenDoctor').textContent = reserva.doctor;
    document.getElementById('resumenServicios').textContent = reserva.servicios.map(function(s) { return s.nombre; }).join(', ');
    document.getElementById('resumenNombre').textContent = reserva.nombre;
    document.getElementById('resumenTelefono').textContent = reserva.telefono;
    document.getElementById('resumenEmail').textContent = reserva.email;
    document.getElementById('resumenTotal').textContent = '$' + total;
}

// =============================================
// CONFIRMAR
// =============================================
async function confirmarReserva() {
    var btn = document.getElementById('btnConfirmar');
    btn.disabled = true;
    btn.innerHTML = '<div class="loading-spinner" style="width:20px;height:20px;border-width:2px;"></div> Reservando...';

    try {
        var res = await fetch(API + '/reservar', {
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

        var resultado = await res.json();

        if (resultado.success) {
            // Formatear fecha bonita
            var fechaObj = new Date(reserva.fecha + 'T12:00:00');
            var opciones = { weekday: 'long', day: 'numeric', month: 'long' };
            var fechaBonita = fechaObj.toLocaleDateString('es-MX', opciones);
            fechaBonita = fechaBonita.charAt(0).toUpperCase() + fechaBonita.slice(1);

            document.getElementById('exitoFolio').textContent = resultado.folio;
            document.getElementById('exitoFechaHora').textContent = fechaBonita + ' a las ' + reserva.hora + ' hrs';
            document.getElementById('exitoConsultorio').textContent = resultado.sucursal;
            document.getElementById('exitoDoctor').textContent = resultado.doctor;

            document.querySelectorAll('.paso').forEach(function(p) { p.classList.remove('active'); });
            document.getElementById('pasoExito').classList.add('active');
            document.querySelectorAll('.step').forEach(function(s) { s.classList.add('completed'); });

            lanzarConfetti();
            showToast('success', '¡Listo!', 'Tu cita ha sido reservada');
        } else {
            showToast('error', 'Error', resultado.error || 'No se pudo reservar');
            btn.disabled = false;
            btn.innerHTML = '✓ Confirmar Reserva';
        }
    } catch (error) {
        showToast('error', 'Error', 'Error de conexión');
        btn.disabled = false;
        btn.innerHTML = '✓ Confirmar Reserva';
    }
}

// =============================================
// NUEVA RESERVA
// =============================================
function nuevaReserva() {
    reserva = { servicios: [], doctor: null, sucursal: null, fecha: null, hora: null, nombre: '', telefono: '', email: '', notas: '' };
    pasoActual = 1;
    categoriaActiva = 'todas';
    mesActual = new Date();
    
    document.querySelectorAll('.selection-item, .servicio-card').forEach(function(el) { el.classList.remove('selected'); });
    document.getElementById('serviciosSeleccionados').style.display = 'none';
    document.getElementById('searchServicios').value = '';
    document.getElementById('inputNombre').value = '';
    document.getElementById('inputTelefono').value = '';
    document.getElementById('inputEmail').value = '';
    document.getElementById('inputNotas').value = '';
    document.getElementById('btnPaso3').disabled = true;
    document.getElementById('fechaSeleccionadaLabel').textContent = 'Selecciona fecha';
    document.getElementById('horariosGrid').innerHTML = '<div class="horarios-empty"><span>👆</span><p>Selecciona fecha</p></div>';
    
    renderCalendario();
    renderCategorias();
    mostrarPaso();
}

// =============================================
// CONFETTI
// =============================================
function lanzarConfetti() {
    var canvas = document.getElementById('confetti');
    var ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    var particulas = [];
    var colores = ['#0A4D68', '#088395', '#05BFDB', '#00FFCA', '#FFD700', '#10B981'];
    
    for (var i = 0; i < 150; i++) {
        particulas.push({
            x: Math.random() * canvas.width,
            y: -20 - Math.random() * 150,
            size: Math.random() * 8 + 4,
            color: colores[Math.floor(Math.random() * colores.length)],
            speedY: Math.random() * 3 + 2,
            speedX: (Math.random() - 0.5) * 4,
            rotation: Math.random() * 360,
            rotationSpeed: (Math.random() - 0.5) * 8
        });
    }
    
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        var activas = 0;
        
        particulas.forEach(function(p) {
            if (p.y < canvas.height + 50) {
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
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }
    
    animate();
}

window.addEventListener('resize', function() {
    var canvas = document.getElementById('confetti');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});
