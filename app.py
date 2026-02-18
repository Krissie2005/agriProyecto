from flask import Flask, render_template, jsonify
import json
import pandas as pd

app = Flask(__name__)

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/geojson")
def geojson():
    with open("data/parroquias.geojson", "r", encoding="utf-8") as f:
        geo = json.load(f)

    try:
        pred = pd.read_csv("data/predicciones.csv", dtype=str)

        pred["DPA_PARROQ"] = (
            pred["DPA_PARROQ"]
            .astype(str)
            .str.strip()
            .str.replace(".0", "", regex=False)
            .str.zfill(6)
        )

        riesgo_map = dict(zip(pred["DPA_PARROQ"], pred["RIESGO_INUNDACION"]))

        if "SCORE" in pred.columns:
            score_map = dict(zip(pred["DPA_PARROQ"], pred["SCORE"]))
        else:
            score_map = {}

    except Exception as e:
        print("Error leyendo predicciones:", e)
        riesgo_map = {}
        score_map = {}

    for feat in geo["features"]:
        p = feat.get("properties", {})
        codigo_geo = str(p.get("DPA_PARROQ", "")).strip().zfill(6)

        p["RIESGO_INUNDACION"] = riesgo_map.get(codigo_geo, None)
        p["SCORE"] = score_map.get(codigo_geo, None)

        feat["properties"] = p

    return jsonify(geo)

if __name__ == "__main__":
    app.run(debug=True)
