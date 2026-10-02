# Catálogos Oficiales del Sistema — Supervisión de Cuartos Telecom

Este documento especifica la estructura, reglas de negocio, ponderaciones y especificaciones técnicas de los **Catálogos Oficiales de Telecomunicaciones e Informática del IMSS — OOAD Baja California**, conforme a los estándares de la Coordinación Delegacional de Informática y los criterios de supervisión de la **Unidad de Evaluación de Órganos Desconcentrados (UEOD)**.

---

## 1. Arquitectura de Catálogos y Jerarquía Operativa

El sistema organiza la supervisión técnica en una estructura jerárquica de 4 niveles:

```text
+-------------------------------------------------------------+
|                      OOAD Baja California                   |
+-------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------+
|                  Ciudades / Zonas Operativas                |
|       (Mexicali, Tijuana, Ensenada, SLRC, Tecate)           |
+-------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------+
|              Unidades Médicas y Administrativas             |
|   (Hospitales, UMF, Subdelegaciones, Almacenes, UMR, etc.)   |
+-------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------+
|             Cuartos de Comunicaciones Específicos           |
|            (MDF Principal, IDFs por piso / servicio)        |
+-------------------------------------------------------------+
```

---

## 2. Catálogo de Ciudades / Zonas (`cities`)

| Identificador (`id`) | Ciudad / Zona Operativa |
|---|---|
| `MXL` | Mexicali |
| `TIJ` | Tijuana |
| `ENS` | Ensenada |
| `SLRC` | San Luis Río Colorado |
| `TKT` | Tecate |

---

## 3. Catálogo de Unidades Médicas y Administrativas (`units`)

El catálogo incluye **63 unidades activas** en la delegación, clasificadas por tipo de instalación y zona geográfica:

| ID | Nombre de la Unidad | Ciudad | Tipo de Unidad | Activo |
|---|---|---|---|---|
| 22 | OOADBC | MXL | Oficinas | Sí |
| 23 | SUBDELEG MXL | MXL | Subdelegación | Sí |
| 24 | SUBDELEG ENS | ENS | Subdelegación | Sí |
| 25 | UMF 32 ENS | ENS | UMF | Sí |
| 26 | SUBDELEG SLRC | SLRC | Subdelegación | Sí |
| 28 | SUBDELEG TIJ | TIJ | Subdelegación | Sí |
| 29 | HGO-MF 7 TIJ | TIJ | Hospital | Sí |
| 32 | CENTRO SEG SOC TIJ | TIJ | Centro de Seguridad Social | Sí |
| 33 | CENTRO SEG SOC SLRC | MXL | Centro de Seguridad Social | Sí |
| 35 | ALMACEN AZUCARERA | MXL | Almacén | Sí |
| 36 | PERIFERICO CFE ROSARITO | TIJ | Oficinas | Sí |
| 37 | UMF 2 POB BENITO JUAREZ | MXL | UMF | Sí |
| 38 | UMF 3 CD MORELOS | MXL | UMF | Sí |
| 39 | UMF 4 EJ DURANGO | MXL | UMF | Sí |
| 40 | UMF 5 EJ NUEVO LEON | MXL | UMF | Sí |
| 41 | UMF 9 LUIS B SANCHEZ | MXL | UMF | Sí |
| 43 | UMF 10 GUADALUPE VICTORIA | MXL | UMF | Sí |
| 44 | UMF 11 EL SAUZAL | ENS | UMF | Sí |
| 45 | UMF 13 SAN QUINTIN | ENS | UMF | Sí |
| 47 | UMF 14 V GUADALUPE | ENS | UMF | Sí |
| 48 | HGS-MF 12 SLRC | SLRC | Hospital | Sí |
| 49 | UMF 19 TIJ CENTRO | TIJ | UMF | Sí |
| 50 | UMF 22 SAN VICENTE | ENS | UMF | Sí |
| 51 | UMF 24 SAN FELIPE | MXL | UMF | Sí |
| 52 | OFNA AUX SAN FELIPE | MXL | Oficinas | Sí |
| 53 | UMF 26 MXL | MXL | UMF | Sí |
| 54 | UMF 29 EL ROSARIO | ENS | UMF | Sí |
| 55 | UMF 34 EL FLORIDO | TIJ | UMF | Sí |
| 56 | UMF 35 LOBOS | TIJ | UMF | Sí |
| 57 | UMF 36 MESA DE OTAY | TIJ | UMF | Sí |
| 58 | SUBSEDE DELEGACIONAL | TIJ | Oficinas | Sí |
| 59 | UMF 37 PALMAR SANTA ANITA | MXL | UMF | Sí |
| 60 | ALMACEN DELEGACIONAL BCN | MXL | Almacén | Sí |
| 64 | CENTRO SEGURIDAD SOCIAL MXL | MXL | Centro de Seguridad Social | Sí |
| 69 | HGR 1 TIJ | TIJ | Hospital | Sí |
| 70 | PERIFERICO MANEADERO | ENS | Periférico | Sí |
| 71 | SUBDELEG TKT | TKT | Subdelegación | Sí |
| 72 | HGZ-MF 8 ENS | ENS | Hospital | Sí |
| 73 | UMF NO 15 EJ HERMOSILLO | MXL | UMF | Sí |
| 74 | HGR 20 TIJ | TIJ | Hospital | Sí |
| 75 | HGE 30 MXL | MXL | Hospital | Sí |
| 76 | HGP-MF 31 MXL | MXL | Hospital | Sí |
| 77 | UMF 16 MXL | MXL | UMF | Sí |
| 78 | UMF 17 ROSARITO | TIJ | UMF | Sí |
| 79 | UMF 25 ENS | ENS | UMF | Sí |
| 80 | UMF 27 TIJ | TIJ | UMF | Sí |
| 81 | UMF 28 MXL | MXL | UMF | Sí |
| 82 | UMF 33 TIJ | TIJ | UMF | Sí |
| 2497 | CENTRO CAPA TIJ | TIJ | Centro CAPA | Sí |
| 2714 | HRS 69 SAN QUINTIN | ENS | Hospital | Sí |
| 2930 | TIENDA IMSS ENS | ENS | Tienda | Sí |
| 2932 | TIENDA IMSS TIJ | TIJ | Tienda | Sí |
| 70128 | UMF 38 SLRC | SLRC | UMF | Sí |
| 70129 | UMF 39 TKT | TKT | UMF | Sí |
| 70159 | GUARDERIA MXL | MXL | Guardería | Sí |
| 70160 | GUARDERIA ENS | ENS | Guardería | Sí |
| 70175 | TEATRO IMSS TIJUANA | TIJ | Teatro | Sí |
| 70176 | PERIFERICO SONY | TIJ | Periférico | Sí |
| 70177 | BODEGA IMSS TIJUANA | TIJ | Bodega | Sí |
| 70179 | PERIFERICO SHARP | TIJ | Periférico | Sí |
| 70302 | GUARDERIA TIJ | TIJ | Guardería | Sí |
| 70304 | ESC DE ENFERMERIA | TIJ | Escuela | Sí |
| 70340 | HGS 6 TKT | TKT | Hospital | Sí |
| 70507 | UMF 18 TIJ | TIJ | UMF | Sí |
| 70508 | UMF 40 MXL | MXL | UMF | Sí |
| 70657 | CENTRO CAPA MXL | MXL | Centro CAPA | Sí |
| 70700 | PERIFERICO HIPODROMO | TIJ | Periférico | Sí |
| 70836 | PERIFERICO TELNOR | TIJ | Periférico | Sí |
| 70921 | UDDCM | TIJ | Unidad | Sí |
| 70923 | UMF 21 ROSARITO | TIJ | UMF | Sí |
| 70945 | PARQUE IMSS | MXL | Parque | Sí |
| 71070 | HOSPITAL COVID TIJUANA | TIJ | Hospital | Sí |
| 71389 | CENTRO DE MEZCLAS UMAA 36 | TIJ | Centro de Mezclas | Sí |
| 71498 | HOSPITAL GENERAL REGIONAL 23 | ENS | Hospital | Sí |
| 71594 | UMR CAMALÚ | ENS | UMR | Sí |
| 71595 | UMR LÁZARO CÁRDENAS | ENS | UMR | Sí |
| 71616 | UMR EJIDO PUNTA COLONET | ENS | UMR | Sí |
| 71617 | UMR SANTO TOMAS | ENS | UMR | Sí |
| 71618 | UMR EJIDO VILLA DE JESUS MARIA | ENS | UMR | Sí |
| 71878 | UMR EJIDO CUCAPAH INDÍGENA | ENS | UMR | Sí |
| 71879 | UMR EJIDO YUCATÁN | ENS | UMR | Sí |
| 71880 | UMR EL PORVENIR (GUADALUPE) | ENS | UMR | Sí |
| 71881 | UMR ESTACIÓN PESCADEROS (KM. 39) | ENS | UMR | Sí |
| 71882 | UMR MICHOACÁN DE OCAMPO | ENS | UMR | Sí |
| 71883 | UMR POBLADO JESÚS SANSÓN FLORES | ENS | UMR | Sí |

---

## 4. Catálogo de Cuartos de Telecomunicaciones (`rooms`)

Los cuartos están vinculados a cada unidad mediante `unitId`, permitiendo seleccionar el punto exacto de supervisión:

- **MDF (Main Distribution Frame):** Distribuidor principal presente en todas las unidades y subsedes.
- **IDF (Intermediate Distribution Frame):** Distribuidores intermedios ubicados en pisos, alas hospitalarias, laboratorios, urgencias, farmacia, quirófanos, cuerpo de gobierno o áreas administrativas.

### Ejemplos Representativos de Cuartos Catalogados:

| ID Cuarto | Unidad Asociada (`unitId`) | Nombre del Cuarto | Tipo de Montaje |
|---|---|---|---|
| `ID22CUARTO1` | 22 (OOADBC) | MDF | Rack / Piso |
| `ID22CUARTO2` | 22 (OOADBC) | IDF - INFORMATICA | Rack |
| `ID24CUARTO1` | 24 (SUBDELEG ENS) | MDF CONMUTADOR 2DO PISO RACK | Rack |
| `ID28CUARTO1` | 28 (SUBDELEG TIJ) | MDF RACK Y GABINETE | Ambos |
| `ID29CUARTO1` | 29 (HGO-MF 7 TIJ) | IDF CONMUTADOR RACK Y GABINETE | Ambos |
| `ID72CUARTO6` | 72 (HGZ-MF 8 ENS) | IDF QUIROFANO PLANTA BAJA | Gabinete |
| `ID74CUARTO5` | 74 (HGR 20 TIJ) | IDF RADIOTERAPIA RACK | Rack |
| `ID75CUARTO8` | 75 (HGE 30 MXL) | IDF - UCI | Rack |
| `ID75CUARTO11`| 75 (HGE 30 MXL) | IDF - BANCO SANGRE | Rack |
| `ID82CUARTO6` | 82 (UMF 33 TIJ) | IDF IMAGENOLOGIA RACK | Rack |

---

## 5. Secciones del Cuestionario de Supervisión (`sections`)

El formulario de captura interactiva se agrupa en **8 secciones funcionales**:

1. `fisica` — **Física:** Condiciones del espacio arquitectónico, delimitación, limpieza de pisos, muros, plafón, ventanas, luminarias y climatización/extracción.
2. `seguridad` — **Seguridad:** Control de accesos con llave, ausencia de objetos ajenos, termometría ambiental (18-24°C), extintores tipo CO₂ vigentes y detectores de humo.
3. `control` — **Control:** Señalética de seguridad, diagrama de red visible, bitácoras de acceso y mantenimiento, y calendario preventivo visible.
4. `infraestructura` — **Infraestructura:** Enlaces y cascadeos identificados, conteo de nodos de datos/voz (instalados vs. funcionando) y orden del cableado en organizadores.
5. `equipos` — **Equipos:** Conteo de switches y servidores instalados, y estado de alarmas lumínicas/acústicas.
6. `telefonia` — **Telefonía:** Conmutador (existencia, tecnología IP/Analógica/Híbrida, líneas troncales, extensiones, contestadora y operatividad).
7. `ups` — **Sistema eléctrico y respaldo:** Operatividad de UPS, circuitos eléctricos independientes, tomas de corriente regulada color naranja y conexiones a tierra física de racks y switches.
8. `observaciones` — **Observaciones:** Captura libre de hallazgos técnicos, detalles específicos y recomendaciones.

---

## 6. Catálogo Completo de Preguntas (`questions`: Q001 a Q042)

A continuación se detalla cada reactivo normativo con su ponderación, nivel de criticidad, reglas de visibilidad condicional y recomendaciones generadas:

| ID | Sección | Título / Reactivo | Tipo | Peso (Pts) | Criticidad | Opciones / Validación | Condición (`visibleIf`) | Campo JSON | Campo PDF | Recomendación Automática ante Incumplimiento |
|---|---|---|---|:---:|:---:|---|---|---|---|---|
| **Q001** | `fisica` | Tipo de instalación | `radio` | 0 | Baja | `['Rack', 'Gabinete', 'Ambos']` | Visible | `tipoInstalacion` | — | — |
| **Q002** | `fisica` | Cuarto delimitado | `radio` | 5 | Media | `['Cumple', 'No Cumple']` | Visible | `cuartoDelimitado` | Cuarto Delimitado | *Requiere delimitar cuarto* |
| **Q003** | `fisica` | Estado de pisos | `radio` | 5 | Media | `['Limpios', 'Sucios']` | Visible | `pisos` | Limpieza Pisos | *Pisos requiere mantenimiento* |
| **Q004** | `fisica` | Estado de muros | `radio` | 5 | Media | `['Limpios', 'Sucios']` | Visible | `muros` | Limpieza Muros | *Muros requiere mantenimiento o pintura* |
| **Q005** | `fisica` | Estado del plafón | `radio` | 5 | Media | `['Cumple', 'No Cumple']` | Visible | `plafon` | Limpieza Plafón | *Plafón requiere mantenimiento o cambio* |
| **Q006** | `fisica` | Estado de ventanas | `radio` | 5 | Baja | `['Cumple', 'No Cumple', 'No Aplica']` | Visible | `ventanas` | Limpieza Ventanas | *Ventanas requiere mantenimiento* |
| **Q007** | `fisica` | Estado de iluminación | `radio` | 5 | Media | `['Cumple', 'No Cumple']` | Visible | `iluminacion` | Luminarias Adecuadas | *Iluminación no adecuada o requiere reparación* |
| **Q008** | `fisica` | Existe sistema climatización o Extracción | `radio` | 15 | **Alta** | `['Cumple', 'No Cumple']` | Visible | `climatizacion` | Climatizado (AC o Extractor) | *Requiere sistema de climatización o extracción* |
| **Q009** | `seguridad` | Llaves de acceso restringido | `radio` | 10 | **Alta** | `['Cumple', 'No Cumple']` | Visible | `llaves` | Llaves | *Requiere llaves de acceso restringido* |
| **Q010** | `seguridad` | Existen objetos ajenos | `radio` | 10 | **Alta** | `['Libre de objetos ajenos', 'No esta libre']` | Visible | `objetosAjenos` | Libre de objetos ajenos | *Existen objetos ajenos al cuarto - RETIRARLOS A LA BREVEDAD* |
| **Q011** | `seguridad` | Existe termómetro | `radio` | 5 | Media | `['Cumple', 'No Cumple']` | Visible | `termometro` | Termómetro | *Requiere instalación de termometría* |
| **Q012** | `seguridad` | Temperatura del cuarto (18-24°C) | `radio` | 10 | **Alta** | `['Cumple', 'No Cumple', 'No Aplica']` | Visible | `temperatura` | Temperatura 18-24°C | — |
| **Q013** | `seguridad` | Existe extintor | `radio` | 15 | **Alta** | `['Existe', 'No existe']` | Visible | `extintor` | Extintor CO2 | *Requiere instalación de Extintor CO2* |
| **Q014** | `seguridad` | Tipo de extintor | `radio` | 0 | Baja | `['CO₂', 'Otro']` | Q013 == 'Existe' | `tipoExtintor` | — | — |
| **Q015** | `seguridad` | Extintor vigente | `radio` | 10 | **Alta** | `['Sí', 'No']` | Q014 == 'CO₂' | `extintorVigente` | — | — |
| **Q016** | `seguridad` | Existe detector de humo | `radio` | 10 | **Alta** | `['Cumple', 'No Cumple']` | Visible | `detectorHumo` | Detector de Humo | *Requiere instalación de Detector de Humo* |
| **Q017** | `control` | Cuenta con señalización? | `radio` | 5 | Media | `['Sí', 'No']` | Visible | `senalizacion` | Señalización | *Requiere colocación de señalización* |
| **Q018** | `control` | Existe diagrama de red | `radio` | 10 | **Alta** | `['Cumple', 'No Cumple']` | Visible | `diagramaRed` | Diagrama de Red | *Colocar diagrama de red* |
| **Q019** | `control` | Existe bitácora de accesos | `radio` | 5 | Media | `['Cumple', 'No Cumple']` | Visible | `bitacora` | Bitácora Accesos | *Colocar bitácora de accesos* |
| **Q020** | `control` | Existe bitácora de mantenimiento | `radio` | 5 | Media | `['Cumple', 'No Cumple']` | Visible | `bitacoraMantenimiento` | Bitácora Mantenimiento | *Colocar bitácora de mantenimientos* |
| **Q021** | `control` | Existe calendario de mantenimiento | `radio` | 5 | Media | `['Cumple', 'No Cumple']` | Visible | `calendarioMantenimiento` | Calendario Mantenimiento | *Colocar calendario* |
| **Q022** | `infraestructura` | Enlaces y cascadeos identificados | `radio` | 5 | Media | `['Cumple', 'No Cumple']` | Visible | `cableadoIdentificado` | Enlaces Identificados | *Colocar etiquetas de identificación de enlaces* |
| **Q023** | `infraestructura` | Número de nodos de Datos instalados | `number` | 0 | Media | Rango: 0 a 100,000 | Visible | `nodosInstalados` | Nodos de Datos | — |
| **Q024** | `infraestructura` | Número de nodos de Datos funcionando | `number` | 0 | Media | Rango: 0 a 100,000 | Visible | `nodosFuncionando` | — | — |
| **Q025** | `infraestructura` | Número de nodos de Voz instalados | `number` | 0 | Baja | Rango: 0 a 100,000 | Visible | `nodosVoz` | Nodos de Voz | — |
| **Q026** | `infraestructura` | Número de nodos de Voz funcionando | `number` | 0 | Baja | Rango: 0 a 100,000 | Visible | `nodosVozFuncionando` | — | — |
| **Q027** | `infraestructura` | Cableado ordenado en organizadores | `radio` | 5 | Media | `['Cumple', 'No Cumple']` | Visible | `cableadoOrdenado` | — | *Requiere ordenar cableado en organizadores* |
| **Q028** | `equipos` | Número de Switches | `number` | 0 | Media | Rango: 0 a 10,000 | Visible | `switches` | — | — |
| **Q029** | `equipos` | Número de Servidores | `number` | 0 | Media | Rango: 0 a 10,000 | Visible | `servidores` | — | — |
| **Q030** | `equipos` | Estado de alarmas | `radio` | 5 | Media | `['Sin Alarmas', 'Con Alarmas']` | Visible | `alarmas` | — | — |
| **Q031** | `telefonia` | Existe Conmutador | `radio` | 0 | Media | `['Sí', 'No']` | Visible | `existeConmutador` | — | — |
| **Q032** | `telefonia` | Tecnología | `radio` | 0 | Baja | `['Digital/IP', 'Analógico', 'Hibrido']` | Q031 == 'Sí' | `tecnologia` | — | — |
| **Q033** | `telefonia` | Número de líneas troncales | `number` | 0 | Baja | Rango: 0 a 10,000 | Q031 == 'Sí' | `lineasTroncales` | — | — |
| **Q034** | `telefonia` | Número de extensiones | `number` | 0 | Baja | Rango: 0 a 100,000 | Q031 == 'Sí' | `extensiones` | — | — |
| **Q035** | `telefonia` | Tipo de contestadora | `radio` | 0 | Baja | `['Automático', 'Personal humano', 'No Existe']` | Q031 == 'Sí' | `contestador` | — | — |
| **Q036** | `telefonia` | Estado del conmutador | `radio` | 5 | Media | `['Funcionando', 'Fuera de servicio']` | Q031 == 'Sí' | `estadoConmutador` | — | — |
| **Q037** | `ups` | Estado del UPS | `radio` | 15 | **Alta** | `['Funciona', 'No Funciona', 'Requiere']` | Visible | `estadoUPS` | UPS Funcionando | *Requiere UPS* |
| **Q038** | `ups` | Sistema eléctrico independiente | `radio` | 15 | **Alta** | `['Cumple', 'No Cumple']` | Visible | `sistemaIndependiente` | Sistema Independiente | *Requiere sistema eléctrico independiente* |
| **Q039** | `ups` | Corriente regulada (Naranja) | `radio` | 10 | **Alta** | `['Cumple', 'No Cumple']` | Visible | `corrienteRegulada` | Corriente Regulada | *Requiere corriente regulada contactos NARANJA* |
| **Q040** | `ups` | Tierra física en Rack/Gabinete | `radio` | 10 | **Alta** | `['Cumple', 'No Cumple']` | Visible | `tierraRack` | Tierra Física Rack/Gab | *Requiere instalación de tierra fisica en rack* |
| **Q041** | `ups` | Tierra física en equipos switch | `radio` | 10 | **Alta** | `['Cumple', 'No Cumple']` | Visible | `tierraEquipos` | Tierra Física Equipos | *Requiere tierra física en equipos switch* |
| **Q042** | `observaciones` | Observaciones técnicas | `textarea` | 0 | Baja | Texto libre | Visible | `observacionesTexto` | — | — |

---

## 7. Criterios de Calificación y Reglas de Negocio

### 7.1 Valores Conformes (`COMPLIANT_VALUES`)
Las siguientes respuestas otorgan la ponderación completa asignada al reactivo:
- `'Cumple'`
- `'Limpios'`
- `'Sí'`
- `'Existe'`
- `'Funciona'`
- `'Funcionando'`
- `'Libre de objetos ajenos'`
- `'CO₂'`
- `'Sin Alarmas'`
- `'Automático'`

### 7.2 Valores Neutros (`NEUTRAL_VALUES`)
- `'No Aplica'` (Excluido de la suma de puntos posibles y de la base de cálculo de porcentaje para no penalizar a la unidad).

### 7.3 Ponderación Máxima Teórica
- La suma de pesos de reactivos con puntaje asciende a **170 puntos**.
- Los reactivos de criticidad **Alta** (Q008 Climatización, Q009 Llaves, Q010 Objetos ajenos, Q012 Temperatura, Q013 Extintor, Q015 Vigencia extintor, Q016 Detector humo, Q018 Diagrama red, Q037 UPS, Q038 Sistema independiente, Q039 Contactos naranja, Q040 Tierra rack, Q041 Tierra switches) concentran el **80% del valor total de la supervisión**.

---

## 8. Especificación del Layout de Reporte PDF Institucional (`pdfLayout`)

Para la generación de reportes ejecutivos (Etapa 4):

### 8.1 Dimensiones y Formato Físico
- **Tamaño:** Carta (`[612, 792]` puntos tipográficos @ 72 dpi).
- **Márgenes:** `40 pt` en todos los bordes.
- **Título Oficial:** `REPORTE DE EVALUACIÓN`
- **Subtítulo:** `Telecom - Informática`
- **Enfoque Institucional:** `Control de Seguridad para Redes de Voz y Datos`

### 8.2 Campos de Identificación del Encabezado
`['Unidad', 'Cuarto', 'Evaluador', 'Folio Evaluación', 'Fecha']`

### 8.3 Mapeo de Secciones del PDF
Las filas del documento PDF se generan dinámicamente mediante las referencias `field` vinculadas a los campos `jsonField` de la evaluación:

1. **MANTENIMIENTO Y LIMPIEZA:**
   - Cuarto Delimitado (`cuartoDelimitado`)
   - Limpieza Pisos (`pisos`)
   - Limpieza Muros (`muros`)
   - Limpieza Plafón (`plafon`)
   - Limpieza Ventanas (`ventanas`)

2. **SEGURIDAD BÁSICA:**
   - Llaves (`llaves`)
   - Libre de objetos ajenos (`objetosAjenos`)
   - Termómetro (`termometro`)
   - Temperatura 18-24°C (`temperatura`)
   - Extintor (`extintor`)
   - Tipo Extintor (`tipoExtintor`)
   - Extintor Vigente (`extintorVigente`)
   - Detector de Humo (`detectorHumo`)
   - Climatizado (AC o Extractor) (`climatizacion`)
   - Luminarias Adecuadas (`iluminacion`)

3. **CONTROL Y NAVEGACIÓN:**
   - Señalización (`senalizacion`)
   - Diagrama de Red (`diagramaRed`)
   - Bitácora Accesos (`bitacora`)
   - Bitácora Mantenimiento (`bitacoraMantenimiento`)
   - Calendario Mantenimiento (`calendarioMantenimiento`)

4. **INFRAESTRUCTURA DE RED:**
   - Enlaces Identificados (`cableadoIdentificado`)
   - Nodos de Datos (`nodosInstalados`)
   - Nodos de Voz (`nodosVoz`)
   - Cableado Ordenado (`cableadoOrdenado`)

5. **EQUIPOS Y RESPALDO:**
   - Switches (`switches`)
   - Servidores (`servidores`)
   - Estado de Alarmas (`alarmas`)
   - UPS (`estadoUPS`)
   - Sistema Independiente (`sistemaIndependiente`)
   - Corriente Regulada (`corrienteRegulada`)
   - Tierra Física Rack/Gab (`tierraRack`)
   - Tierra Física Switch (`tierraEquipos`)

### 8.4 Fundamento Legal Institucional UEOD
El pie de página del reporte PDF incluye obligatoriamente la nota referente oficial:

> **Nota Referente:**
> Los requerimientos detectados, están alineados con los criterios que utiliza la Unidad de Evaluación de Órganos Desconcentrados (UEOD) durante las supervisiones que efectúa, por lo que su incumplimiento u omisión puede dar lugar a una observación por parte de esta autoridad o en su caso más extremo, comprometer el correcto funcionamiento de los servidores de aplicaciones y equipos de las redes de voz y datos.
>
> *Referencia: Manual de Organización de la Coordinación Delegacional de Informática. Apartado: 7 Funciones Sustantivas (7.1) Incisos 18 y 24.*

- **Espacio para Sello y Firma:** Contiene recuadro dedicado con la etiqueta `SELLO DE LA UNIDAD`.
