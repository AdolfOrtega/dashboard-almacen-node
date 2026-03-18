const API_URL = 'http://localhost:3000/api/conceptos';
// Función para obtener y listar conceptos
async function cargarConceptos() {
const respuesta = await fetch(API_URL);
const conceptos = await respuesta.json();
const tabla = document.getElementById('tabla-body');
tabla.innerHTML = "";
conceptos.forEach(c => {
tabla.innerHTML += `
<tr>
<td>${c.clave}</td>
<td>${c.descripcion}</td>
<td>
<button class="btn btn-danger btn-sm" onclick="eliminar('${c.clave}')">Eliminar</button>
</td>
</tr>`;
});
}
// Función para guardar (POST)
document.getElementById('formConcepto').addEventListener('submit', async (e) => {
e.preventDefault();
const datos = {
clave: document.getElementById('clave').value,
descripcion: document.getElementById('desc').value
};
await fetch(API_URL, {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify(datos)
});
document.getElementById('formConcepto').reset();
cargarConceptos();
});
// Función para eliminar (DELETE)
async function eliminar(clave) {
if (confirm(`¿Eliminar concepto ${clave}?`)) {
await fetch(`${API_URL}/${clave}`, { method: 'DELETE' });
cargarConceptos();
}
}
// Carga inicial
cargarConceptos();