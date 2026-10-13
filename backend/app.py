import os
import time
import pymysql
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)


def conectar():
    """Intenta conectar a MySQL con reintentos (espera a que el contenedor levante)."""
    intentos = 0
    while intentos < 10:
        try:
            conn = pymysql.connect(
                host=os.environ["DB_HOST"],
                user=os.environ["DB_USER"],
                password=os.environ["DB_PASSWORD"],
                database=os.environ["DB_NAME"],
                autocommit=True,
                cursorclass=pymysql.cursors.DictCursor,
            )
            return conn
        except Exception as e:
            intentos += 1
            print(f"[BD] Intento {intentos}/10 fallido: {e}")
            time.sleep(3)
    raise RuntimeError("No se pudo conectar a la base de datos.")


def crear_tabla(cursor):
    cursor.execute(
        "CREATE TABLE IF NOT EXISTS tareas ("
        "id INT AUTO_INCREMENT PRIMARY KEY, "
        "titulo VARCHAR(200) NOT NULL, "
        "completada TINYINT(1) DEFAULT 0, "
        "creada_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP)"
    )


# ── Health check ──────────────────────────────────────────────────────────────

@app.route("/")
def inicio():
    return jsonify(mensaje="API de Gestor de Tareas — OK", version="1.0")


# ── GET /tareas ───────────────────────────────────────────────────────────────

@app.route("/tareas")
def listar_tareas():
    conn = conectar()
    with conn.cursor() as cursor:
        crear_tabla(cursor)
        cursor.execute("SELECT id, titulo, completada, creada_en FROM tareas ORDER BY id DESC")
        tareas = cursor.fetchall()
    conn.close()
    # Convertir TINYINT a bool y datetime a string
    for t in tareas:
        t["completada"] = bool(t["completada"])
        if t["creada_en"]:
            t["creada_en"] = t["creada_en"].isoformat()
    return jsonify(tareas)


# ── POST /tareas ──────────────────────────────────────────────────────────────

@app.route("/tareas", methods=["POST"])
def crear_tarea():
    datos = request.get_json()
    titulo = (datos or {}).get("titulo", "").strip()
    if not titulo:
        return jsonify(error="El campo 'titulo' es obligatorio."), 400
    conn = conectar()
    with conn.cursor() as cursor:
        crear_tabla(cursor)
        cursor.execute("INSERT INTO tareas (titulo) VALUES (%s)", (titulo,))
        nueva_id = cursor.lastrowid
        cursor.execute("SELECT id, titulo, completada, creada_en FROM tareas WHERE id = %s", (nueva_id,))
        tarea = cursor.fetchone()
    conn.close()
    tarea["completada"] = bool(tarea["completada"])
    if tarea["creada_en"]:
        tarea["creada_en"] = tarea["creada_en"].isoformat()
    return jsonify(tarea), 201


# ── PUT /tareas/<id> ──────────────────────────────────────────────────────────

@app.route("/tareas/<int:tarea_id>", methods=["PUT"])
def actualizar_tarea(tarea_id):
    datos = request.get_json() or {}
    conn = conectar()
    with conn.cursor() as cursor:
        crear_tabla(cursor)
        # Actualizar título, completada o ambos
        if "titulo" in datos:
            cursor.execute(
                "UPDATE tareas SET titulo = %s WHERE id = %s",
                (datos["titulo"].strip(), tarea_id)
            )
        if "completada" in datos:
            cursor.execute(
                "UPDATE tareas SET completada = %s WHERE id = %s",
                (int(datos["completada"]), tarea_id)
            )
        cursor.execute("SELECT id, titulo, completada, creada_en FROM tareas WHERE id = %s", (tarea_id,))
        tarea = cursor.fetchone()
    conn.close()
    if not tarea:
        return jsonify(error="Tarea no encontrada."), 404
    tarea["completada"] = bool(tarea["completada"])
    if tarea["creada_en"]:
        tarea["creada_en"] = tarea["creada_en"].isoformat()
    return jsonify(tarea)


# ── DELETE /tareas/<id> ───────────────────────────────────────────────────────

@app.route("/tareas/<int:tarea_id>", methods=["DELETE"])
def eliminar_tarea(tarea_id):
    conn = conectar()
    with conn.cursor() as cursor:
        crear_tabla(cursor)
        cursor.execute("DELETE FROM tareas WHERE id = %s", (tarea_id,))
        afectadas = cursor.rowcount
    conn.close()
    if afectadas == 0:
        return jsonify(error="Tarea no encontrada."), 404
    return jsonify(eliminado=tarea_id)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
