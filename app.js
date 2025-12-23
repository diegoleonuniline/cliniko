// =============================================
// API - Tu Cloudflare Worker
// =============================================
const API = 'https://yellow-pond-ca9a.diego-leon.workers.dev';

// =============================================
// LEER - Cargar servicios desde AppSheet
// =============================================
async function cargarServicios() {
    try {
        const res = await fetch(API + '/servicios');
        const servicios = await res.json();
        
        const select = document.getElementById('motivoVisita');
        select.innerHTML = '<option value="">Seleccionar servicio...</option>';
        
        servicios.forEach(s => {
            select.innerHTML += `<option value="${s.ID}">${s.Nombre} - $${s.Precio}</option>`;
        });
        
        console.log('✅ Servicios cargados:', servicios.length);
    } catch (error) {
        console.error('❌ Error cargando servicios:', error);
    }
}

// =============================================
// AGREGAR - Guardar cliente en AppSheet
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
// FORMULARIO - Manejar envío
// =============================================
document.getElementById('formCliente').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const btn = document.getElementById('btnEnviar');
    const mensaje = document.getElementById('mensaje');
    
    btn.disabled = true;
    btn.textContent = 'Guardando...';
    mensaje.className = 'mensaje';
    
    // Datos del formulario
    const datos = {
        Nombre: document.getElementById('nombre').value,
        'Teléfono': document.getElementById('telefono').value,
        Email: document.getElementById('email').value,
        FechaNacimiento: document.getElementById('fechaNacimiento').value,
        Sexo: document.getElementById('sexo').value,
        'Motivo de Visita': document.getElementById('motivoVisita').value,
        Notas: document.getElementById('notas').value,
        FechaRegistro: new Date().toLocaleDateString('en-US')
    };
    
    try {
        // AGREGAR a AppSheet
        const resultado = await agregarCliente(datos);
        
        console.log('✅ Cliente guardado:', resultado);
        
        mensaje.className = 'mensaje exito';
        mensaje.textContent = '✅ Paciente registrado correctamente!';
        this.reset();
        cargarServicios();
        
    } catch (error) {
        console.error('❌ Error:', error);
        mensaje.className = 'mensaje error';
        mensaje.textContent = '❌ Error al registrar. Intenta de nuevo.';
    }
    
    btn.disabled = false;
    btn.textContent = 'Registrar Paciente';
});

// =============================================
// INICIAR - Cuando carga la página
// =============================================
cargarServicios();
