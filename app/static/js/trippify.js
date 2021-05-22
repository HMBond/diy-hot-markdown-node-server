class Party {
  constructor(className, athmosphere) {
    this.memory = 0;
    this.className = className;
    this.takers = getOrganisms(className);
    this.athmosphere = athmosphere;
    if (athmosphere.immediateLaunch) {
      this.start();
    }
  }

  start() {
    this.memory = setBeat(this.takers, this.athmosphere);
  }

  stop(police) {
    if (this.memory) {
      clearInterval(this.memory);
    }
    if (police) {
      purgeSpirits(this.className);
    }
  }
}

function getOrganisms(className) {
  const realitySelector = `.${className}:not(.${className}[trip-spirit])`;
  return document.querySelectorAll(realitySelector);
}

function setBeat(takers, athmosphere) {
  return setInterval(() => {
    for (const taker of takers) {
      give(taker, athmosphere);
    }
  }, 666 / athmosphere.dosage);
}

function give(element, athmosphere) {
  const moment = Date.now() / 1000;
  const spirit = summonSpirit(element);
  prepare(spirit, athmosphere, moment);
  scheduleCleanse(spirit, athmosphere);
  element.parentElement.insertBefore(spirit, element);
  const transition = wake(spirit);
  if (transition) {
    setDestiny(spirit, athmosphere, moment);
  }
}

function wake(spirit) {
  return window.getComputedStyle(spirit).transition;
}

function setDestiny(spirit, { blow, wobble, dizzyness }, moment) {
  let scale = '';
  let translation = '';
  let rotation = '';
  if (blow) {
    scale = `scale(${blow})`;
  }
  if (wobble > 0) {
    const x = Math.sin(moment) * wobble;
    const y = Math.cos(moment) * wobble;
    translation = `translate(${x}px, ${y}px)`;
  }
  if (dizzyness) {
    rotation = `rotate(${Math.sin(moment) * dizzyness}deg)`;
  }
  spirit.style.transform = `${scale} ${translation} ${rotation}`;
}

function prepare(spirit, { ripple, magicNumber, speed, curve }, moment) {
  const rippleFx = ripple ? Math.abs(ripple * Math.sin(moment * ripple)) : 0;
  spirit.style.transition = `all ${
    magicNumber / (1 + speed + rippleFx)
  }s ${curve}`;
}

function scheduleCleanse(spirit, { magicNumber, recover, speed }) {
  setTimeout(() => {
    if (spirit) spirit.remove();
  }, (magicNumber * 1000) / (recover * speed));
}

function summonSpirit(element) {
  const spirit = element.cloneNode(true);
  spirit.setAttribute('trip-spirit', '');
  spirit.id = '';
  return spirit;
}

function purgeSpirits(className) {
  const spirits = document.querySelectorAll(`.${className}[trip-spirit]`);
  for (let spirit of spirits) {
    spirit.remove();
  }
}

export default function trippify(
  className,
  athmosphere = {
    speed: 10,
    blow: 25,
    curve: 'ease-in',
    dosage: 2,
    ripple: 0,
    wobble: 0,
    recover: 1,
    dizzyness: 300,
    magicNumber: 42,
    immediateLaunch: true,
  },
) {
  return new Party(className, athmosphere);
}
