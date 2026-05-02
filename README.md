# Campeonato de 32 Jugadores

Web estática para mostrar un torneo de 32 jugadores dividido en 4 llaves de 8 participantes.

## Estructura

```txt
torneo-web/
├── index.html
├── css/
│   └── styles.css
├── js/
│   └── app.js
├── data/
│   └── tournament.json
└── assets/
    └── img/
```

## Cómo editar jugadores

Abrir:

```txt
data/tournament.json
```

Cada jugador tiene esta estructura:

```json
{
  "id": "p01",
  "name": "Jugador 1",
  "key": "A",
  "type": "PLAYER",
  "nickname": "NickJugador1"
}
```

- `name`: nombre del personaje/jugador dentro del rol.
- `key`: llave a la que pertenece: `A`, `B`, `C` o `D`.
- `type`: puede ser `PLAYER` o `NPC`.
- `nickname`: solo se usa si es `PLAYER`.

## Cómo avanzar jugadores

Cada combate tiene esta estructura:

```json
{
  "id": "A-QF-1",
  "key": "A",
  "round": "quarter",
  "label": "Cuartos A1",
  "slots": ["p01", "p08"],
  "scores": [0, 0],
  "winnerId": null
}
```

Para marcar ganador:

```json
"winnerId": "p01"
```

También podés actualizar el resultado:

```json
"scores": [2, 1]
```

El sistema mueve automáticamente al ganador a la fase siguiente.

## Cómo probar localmente

No abrir el `index.html` con doble click, porque el navegador puede bloquear la lectura del JSON.

Desde la carpeta del proyecto ejecutar:

```bash
python3 -m http.server 5500
```

Luego abrir:

```txt
http://localhost:5500
```

## Publicación

Este proyecto puede subirse directo a GitHub Pages, Netlify o Vercel.
