# 🌊 Modelo de Clasificación de Riesgo de Inundación por Parroquia – Ecuador
## 📌 Descripción del Proyecto

Este proyecto desarrolla un modelo de clasificación supervisada para estimar el nivel de riesgo de inundación (Bajo, Medio, Alto) a nivel de parroquia en Ecuador.

## Se integran variables:

* Climáticas (precipitación)

* Topográficas (altitud, pendiente)

* Hidrológicas (distancia a ríos)

* Demográficas (población, densidad, urbano/rural)

* Históricas (eventos registrados)

El modelo final seleccionado fue Random Forest, debido a su alto desempeño en precisión, recall, F1-score y AUC.

# 📂 Estructura del Proyecto

```bash
AA - PROYECTO GRUPO 1/
├── app.py
├── README.md
├── requirements.txt
├── data/
│   ├── raw/
│   │   ├── GeoJson parroquias/
│   │   │   ├── nxparroquias.shp
│   │   │   ├── nxparroquias.dbf
│   │   │   ├── nxparroquias.shx
│   │   │   ├── nxparroquias.prj
│   │   │   └── (...)
│   │   ├── GeoTIFF/
│   │   ├── HydroRIVERS_v10_sa.gdb/
│   │   ├── 1_POBL_PROV_CANT_PARR_AREA.xlsx
│   │   ├── Base_Eventos_2010_2023_eventos_catálogo.xlsx
│   │   ├── Densidad poblacional INEC.xlsx
│   │   ├── ecu-rainfall-subnat-full.csv
│   │   ├── GeoTifCompleto.tif
│   │   └── GeoTifCompleto_UTM17S.tif
│   ├── processed/
│   │   ├── base_modelo_FINAL.csv
│   │   ├── base_modelo_FINAL_rio.csv
│   │   ├── base_modelo_FINAL_con_eventos.csv
│   │   ├── topografia_parroquia.csv
│   │   ├── distancia_rio_parroquia.csv
│   │   └── (...)
│   ├── parroquias.geojson
│   └── predicciones.csv
├── notebooks/
│   └── notebook.ipynb
├── static/
│   └── map.js
└── templates/
    └── index.html
```


# 📊 Flujo de Integración de Datos

A continuación se describe cómo se fusionaron los datasets:

## 1️⃣ Densidad + Urbano/Rural

### Entradas:

* Densidad poblacional INEC.xlsx

* 1_POBL_PROV_CANT_PARR_AREA.xlsx

### Proceso:

* Limpieza y normalización de nombres.

* Cálculo de PORC_URBANO y PORC_RURAL.

* Unión por PROVINCIA, CANTON, PARROQUIA.


### Salida:

* densidadPop_ProporcionUrbRur.csv

## 2️⃣ Integración de Precipitación

### Entrada:

* ecu-rainfall-subnat-full.csv

### Proceso:

* Cálculo de precipitación promedio (PRECIP_PROM)

* Unión con base demográfica

## 3️⃣ Integración Topográfica (DEM + Pendiente)

### Entrada:

GeoTIFF descargados de EarthExplorer

### Proceso:

* Unión de tiles

* Cálculo de altitud media (ALT_MEDIA)

* Cálculo de pendiente media y máxima

* Agregación por parroquia

### Salida:

* topografia_parroquia.csv

## 4️⃣ Distancia a Ríos

### Entrada:

* HydroRIVERS (Sudamérica)

* Shapefile parroquias

### Proceso:

* Filtrado de ríos que intersectan Ecuador

* Cálculo de distancia mínima desde el centroide de cada parroquia (DIST_RIO_M)

## 5️⃣ Construcción Base Final del Modelo

Se integraron todas las variables anteriores en:

* base_modelo_FINAL_con_eventos.csv

### Incluye:

* Variables climáticas

* Variables topográficas

* Variables demográficas

* Distancia a ríos

* Eventos históricos

# 🎯 Construcción de la Variable Objetivo

Se creó una variable categórica RIESGO_INUNDACION basada en:

* Precipitación alta

* Cercanía a ríos

* Pendientes bajas

* Presencia de eventos históricos

## Clasificación final:

### 🟢 Bajo

### 🟠 Medio

### 🔴 Alto

# 🤖 Modelos Evaluados

Se probaron:

* Regresión Logística

* Árbol de Decisión

* Random Forest

* Ensamble

* SVM

### El Random Forest base fue seleccionado por:

* Accuracy ≈ 0.99

* AUC ≈ 1.00

* Recall = 1.00 en clase “Alto”

* Métrica prioritaria: Recall en clase Alto, debido al enfoque de gestión del riesgo.

# 📈 Generación de Predicciones

El modelo final generó:

* predicciones.csv

Contiene:

* DPA_PARROQ

* RIESGO_INUNDACION

* SCORE (probabilidad máxima)

El emparejamiento con el shapefile se realizó mediante DPA_PARROQ.

# ⚙️ Instalación y Ejecución

### 1️⃣ Crear entorno virtual (opcional pero recomendado)
python -m venv venv
venv\Scripts\activate   # Windows

### 2️⃣ Instalar dependencias
pip install -r requirements.txt

### 3️⃣ Ejecutar el Notebook

#### Abrir:

* notebook.ipynb


* Ejecutar todas las celdas en orden.


# 📦 Requerimientos

Archivo requirements.txt:

* pandas
* numpy
* geopandas
* shapely
* pyogrio
* rasterio
* scikit-learn
* matplotlib
* seaborn

# 🌎 Fuentes de Datos

* Precipitación: HDX – Ecuador Rainfall Subnational

* Eventos históricos: HydroShare

* Densidad y población: INEC

* Shapefiles parroquias: Geoportal INEC

* DEM (GeoTIFF): USGS EarthExplorer

* Ríos: HydroSHEDS – HydroRIVERS

# 🏁 Conclusión

El proyecto demuestra que la integración de variables geoespaciales, climáticas y demográficas, junto con modelos de ensamble robustos como Random Forest, permite una estimación confiable del riesgo de inundación a nivel parroquial, con alta capacidad de discriminación y sensibilidad en zonas de alto riesgo.