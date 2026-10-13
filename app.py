import os
import pymysql
from flask import Flask, jsonify

app = Flask(__name__)


def conectar():
    return pymysql.connect(
        host=os.environ["DB_HOST"],
        user=os.environ["DB_USER"],
        password=os.environ["DB_PASSWORD"],
        database=os.environ["DB_NAME"],
        autocommit=True,
        cursorclass=pymysql.cursors.DictCursor,
    )


def crear_tabla(cursor):
    cursor.execute(
        "CREATE TABLE IF NOT EXISTS productos ("
        "id INT AUTO_INCREMENT PRIMARY KEY, "
        "nombre VARCHAR(50))"
    )


@app.route("/")
def inicio():
    return jsonify(mensaje="Hola desde un contenedor Docker")


@app.route("/agregar/<nombre>")
def agregar(nombre):
    conn = conectar()
    with conn.cursor() as cursor:
        crear_tabla(cursor)
        cursor.execute(
            "INSERT INTO productos (nombre) VALUES (%s)",
            (nombre,)
        )
    conn.close()
    return jsonify(agregado=nombre)


@app.route("/productos")
def productos():
    conn = conectar()
    with conn.cursor() as cursor:
        crear_tabla(cursor)
        cursor.execute("SELECT id, nombre FROM productos")
        filas = cursor.fetchall()
    conn.close()
    return jsonify(filas)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)