const choo = require('choo')
const cache = require('cache-element')
const html = require('choo/html')
const sf = require('sheetify')
const app = choo()

sf('./main.styl', { global: true })
window.requestAnimationFrame = window.requestAnimationFrame ||
window.mozRequestAnimationFrame ||
window.webkitRequestAnimationFrame ||
window.msRequestAnimationFrame

const randomRange =
  (min, max) => Math.floor(Math.random() * (max - min + 1)) + min


app.model({
  state: {
    velocity: .5,
    particules: [],
    canvas: null,
    ctx: null,
  },
  reducers: {
    init: (data, state) =>
      Object.assign({}, state, data),
    add: (data, state) =>
      Object.assign({}, state, {
        particules: [ ...state.particules, data]
      }),
    update: (data, state) =>
      Object.assign({}, state, {
        velocity: data / 10
      }),
    updateP: (data, state) =>
      Object.assign({}, state, {
        particules: data 
      })
  },
  effects: {
    addTimer: (data, state, send, done) => {
      const velo = randomRange(160, 200) + 200 * state.velocity
      send('add', Particles(
        0,
        velo,
        state.velocity,
        { h: (randomRange(1, 20) + 159) * state.velocity, s: 42, l: 34 },
        randomRange(10, (10 + 30 * velo))
      )
      , done)
      setTimeout(() => 
        send('addTimer', done), 100 - (.2 + parseInt(state.velocity)))
    },
    frame: (data, state, send, done) => {
      if (state.canvas === null) {
        const canvas = document.querySelector('#world')
        const ctx = canvas.getContext('2d')
        send('init', { canvas, ctx }, done)
        send('addTimer', done)
        return requestAnimationFrame(() => send('frame', done))
      }
      else{
        state.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
        const move = (particle) => 
        Object.assign({}, particle, {
          age: 0,
          x: particle.x + (.5 + 5 * particle.velocity),
          y: particle.y
        })
        const aging = p => Object.assign({}, p, { age: p.age + 1 })
        const newP = state.particules.map(move)
        const pp = state.particules
          .map(aging)
          .map(move)
          .filter(x => x.age < 5)
          .filter(x => x.x < window.innerWidth)

        pp.map(p => {
          const gd = state.ctx.createLinearGradient(p.x, p.y, p.x - p.length, p.y)
          gd.addColorStop(0, `hsla(${p.color.h}, ${p.color.s}%, ${p.color.l}%, ${1 - (p.age * .3)})`)
          gd.addColorStop(1, `hsla(${p.color.h}, ${p.color.s}%, ${p.color.l}%, 0)`)

          state.ctx.beginPath()
          state.ctx.arc(p.x, p.y, 2, 0, 2 * Math.PI, false)
          state.ctx.fillStyle = `hsl(${p.color.h}, ${p.color.s}%, ${p.color.l}%)`
          state.ctx.fill()
          state.ctx.strokeStyle = gd
          state.ctx.beginPath()
          state.ctx.moveTo(p.x, p.y)
          state.ctx.lineTo(p.x - (10 + 50 * p.velocity), p.y)
          state.ctx.stroke()
        })
        send('updateP', pp, done)

        requestAnimationFrame(() => send('frame', done))
      }
    }
  },
  subscriptions: [
    (send, done) =>
      requestAnimationFrame(() => send('frame', done)),
  ]
})

const view = cache((state, prev, send) => {
  return html`
    <main>
      <div class='phone'>
        <canvas id='world' width=320 height=568></canvas>
        <div class="range">
          <div class="meter"></div>
          <input type='range' oninput=${e => send('update', e.target.value)} min=0 step=0.25 max=10>
        </div>
      </div>
    </main>
    <svg width="0" height="0">
      <defs>
        <clipPath id="path">
          <circle stroke="#000000" stroke-miterlimit="10" cx="10" cy="2.5" r="2"/>
          <circle stroke="#000000" stroke-miterlimit="10" cx="30" cy="2.5" r="2"/>
          <circle stroke="#000000" stroke-miterlimit="10" cx="50" cy="2.5" r="2"/>
          <circle stroke="#000000" stroke-miterlimit="10" cx="70" cy="2.5" r="2"/>
          <circle stroke="#000000" stroke-miterlimit="10" cx="90" cy="2.5" r="2"/>
          <circle stroke="#000000" stroke-miterlimit="10" cx="110" cy="2.5" r="2"/>
          <circle stroke="#000000" stroke-miterlimit="10" cx="130" cy="2.5" r="2"/>
          <circle stroke="#000000" stroke-miterlimit="10" cx="150" cy="2.5" r="2"/>
          <circle stroke="#000000" stroke-miterlimit="10" cx="170" cy="2.5" r="2"/>
          <circle stroke="#000000" stroke-miterlimit="10" cx="190" cy="2.5" r="2"/>
          <circle stroke="#000000" stroke-miterlimit="10" cx="210" cy="2.5" r="2"/>
          <circle stroke="#000000" stroke-miterlimit="10" cx="230" cy="2.5" r="2"/>
        </clipPath>
      </defs>
    </svg>
  `
})

app.router(r => [ r('/', view) ])


document.addEventListener('DOMContentLoaded', function (event) {
  const tree = app.start()
  document.body.appendChild(tree)
})

const Particles = (posx = 0, posy = 0, velocity = .5, color = {h: 42, s: 34, l: 34}, length = 10) => {
  return {
    x: posx,
    y: posy,
    velocity,
    maxLife: 5,
    age: 0,
    color,
    length,
  }
}
