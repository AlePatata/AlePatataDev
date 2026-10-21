import type { Emotion } from './emotions';

// Un gatito naranjo dibujado a mano; cada emoción cambia ojos, cejas, boca y agrega detalles.
// Colores del tema (src/index.css), así se ve bien en modo claro y oscuro.
const FUR = 'var(--color-cat-fur)';
const STRIPE = 'var(--color-cat-stripe)';
const LINE = 'var(--color-cat-line)';
const SHINE = 'var(--color-cat-shine)';
const TEAR = 'var(--color-cat-tear)';
const BLUSH = 'var(--color-mark)';
const HEART = 'var(--color-danger)';
const MONEY = 'var(--color-positive)';
const POP = 'var(--color-accent)';

type Eyes = 'dot' | 'big' | 'wide' | 'closed' | 'tired' | 'heart' | 'dollar' | 'spiral' | 'none';
type Brows = 'angry' | 'sad';
type Mouth = 'w' | 'smile' | 'frown' | 'o' | 'scream' | 'wavy' | 'flat' | 'grr';
type Extra = 'sweat' | 'tears' | 'zzz' | 'vein' | 'question' | 'hearts' | 'bill' | 'sparkles' | 'sunglasses' | 'paws' | 'shakeLines';

interface Face {
  eyes: Eyes;
  mouth: Mouth;
  brows?: Brows;
  extras?: Extra[];
}

const FACES: Record<Emotion, Face> = {
  ansioso: { eyes: 'wide', brows: 'sad', mouth: 'wavy', extras: ['sweat', 'shakeLines'] },
  enojado: { eyes: 'dot', brows: 'angry', mouth: 'grr', extras: ['vein'] },
  aburrido: { eyes: 'closed', mouth: 'flat', extras: ['zzz'] },
  disociado: { eyes: 'spiral', mouth: 'flat' },
  triste: { eyes: 'big', brows: 'sad', mouth: 'frown', extras: ['tears'] },
  curioso: { eyes: 'big', mouth: 'o', extras: ['question'] },
  endeudado: { eyes: 'tired', mouth: 'wavy', extras: ['sweat', 'bill'] },
  millonario: { eyes: 'dollar', mouth: 'smile', extras: ['sparkles'] },
  panico: { eyes: 'wide', brows: 'sad', mouth: 'scream', extras: ['paws'] },
  enamorado: { eyes: 'heart', mouth: 'w', extras: ['hearts'] },
  orgulloso: { eyes: 'none', mouth: 'smile', extras: ['sunglasses', 'sparkles'] },
};

const stroke = { stroke: LINE, strokeWidth: 3, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' } as const;
const EYE_Y = 60;

function Eye({ x, kind }: { x: number; kind: Eyes }) {
  const y = EYE_Y;
  switch (kind) {
    case 'dot':
      return (
        <>
          <circle cx={x} cy={y} r={5.5} fill={LINE} />
          <circle cx={x + 2} cy={y - 2} r={1.6} fill={SHINE} />
        </>
      );
    case 'big':
      return (
        <>
          <circle cx={x} cy={y} r={9} fill={LINE} />
          <circle cx={x + 3} cy={y - 3} r={3} fill={SHINE} />
          <circle cx={x - 3} cy={y + 3} r={1.5} fill={SHINE} />
        </>
      );
    case 'wide':
      return (
        <>
          <circle cx={x} cy={y} r={8} fill={SHINE} stroke={LINE} strokeWidth={2.5} />
          <circle cx={x} cy={y} r={2} fill={LINE} />
        </>
      );
    case 'closed':
      return <path d={`M${x - 7} ${y - 1} Q${x} ${y + 6} ${x + 7} ${y - 1}`} {...stroke} />;
    case 'tired':
      // Párpado a media asta
      return (
        <>
          <circle cx={x} cy={y + 1} r={6} fill={LINE} />
          <path d={`M${x - 8} ${y + 1} A8 8 0 0 1 ${x + 8} ${y + 1} Z`} fill={FUR} />
          <path d={`M${x - 8} ${y + 1} H${x + 8}`} {...stroke} />
        </>
      );
    case 'heart':
      return (
        <path
          d={`M${x} ${y + 8} C${x - 13} ${y}, ${x - 7} ${y - 10}, ${x} ${y - 3} C${x + 7} ${y - 10}, ${x + 13} ${y}, ${x} ${y + 8} Z`}
          fill={HEART}
          stroke={LINE}
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
      );
    case 'dollar':
      return (
        <>
          <circle cx={x} cy={y} r={8.5} fill={SHINE} stroke={LINE} strokeWidth={2.5} />
          <text x={x} y={y + 1} textAnchor="middle" dominantBaseline="central" fontSize={13} fontWeight={800} fill={MONEY}>
            $
          </text>
        </>
      );
    case 'spiral':
      // Espiral que gira despacito, la mirada perdida
      return (
        <path
          d={`M${x - 1} ${y} a1.5 1.5 0 0 1 3 0 a3 3 0 0 1 -6 0 a4.5 4.5 0 0 1 9 0 a6 6 0 0 1 -12 0 a7.5 7.5 0 0 1 15 0`}
          {...stroke}
          strokeWidth={2}
          className="motion-safe:animate-spin [animation-duration:3s] [transform-box:fill-box] origin-center"
        />
      );
    case 'none':
      return null;
  }
}

function Mouth({ kind }: { kind: Mouth }) {
  switch (kind) {
    case 'w':
      return <path d="M52 77 Q56 82 60 77 Q64 82 68 77" {...stroke} />;
    case 'smile':
      return <path d="M49 77 Q60 90 71 77" {...stroke} />;
    case 'frown':
      return <path d="M52 83 Q60 76 68 83" {...stroke} />;
    case 'o':
      return <ellipse cx={60} cy={82} rx={4} ry={5} fill={LINE} />;
    case 'scream':
      return <ellipse cx={60} cy={85} rx={7} ry={10} fill={LINE} />;
    case 'wavy':
      return <path d="M49 81 l4 -3 l4 3 l4 -3 l4 3 l4 -3" {...stroke} strokeWidth={2.5} />;
    case 'flat':
      return <path d="M53 80 H67" {...stroke} />;
    case 'grr':
      return (
        <>
          <path d="M51 84 Q60 76 69 84" {...stroke} />
          <path d="M55 81.5 l2 5 l2 -4.5 Z" fill={SHINE} stroke={LINE} strokeWidth={1} strokeLinejoin="round" />
        </>
      );
  }
}

function Brows({ kind }: { kind: Brows }) {
  return kind === 'angry' ? (
    <path d="M35 46 L51 53 M85 46 L69 53" {...stroke} />
  ) : (
    <path d="M36 51 L50 46 M84 51 L70 46" {...stroke} />
  );
}

/** Lo que flota alrededor del gatito sube y baja un poco (si el sistema no pide menos movimiento). */
const floaty = 'motion-safe:animate-cat-float [transform-box:fill-box]';

function Extra({ kind }: { kind: Extra }) {
  switch (kind) {
    case 'sweat':
      return <path d="M99 26 Q105 36 99 39 Q93 36 99 26 Z" fill={TEAR} stroke={LINE} strokeWidth={1.5} />;
    case 'tears':
      return <path d="M42 69 V92 M78 69 V92" stroke={TEAR} strokeWidth={5} strokeLinecap="round" />;
    case 'zzz':
      return (
        <g className={floaty} fill={POP} fontWeight={800}>
          <text x={94} y={32} fontSize={12}>z</text>
          <text x={103} y={18} fontSize={17}>Z</text>
        </g>
      );
    case 'vein':
      return <path d="M89 14 q4 5 -1 8 M99 14 q-4 5 1 8 M89 30 q4 -5 -1 -8 M99 30 q-4 -5 1 -8" stroke={HEART} strokeWidth={3} strokeLinecap="round" fill="none" />;
    case 'question':
      return (
        <text className={floaty} x={98} y={30} fontSize={24} fontWeight={800} fill={POP}>
          ?
        </text>
      );
    case 'hearts':
      return (
        <g className={floaty} fill={HEART}>
          <path d="M14 30 C6 25, 9 17, 14 22 C19 17, 22 25, 14 30 Z" />
          <path d="M104 22 C95 16, 98 7, 104 13 C110 7, 113 16, 104 22 Z" />
        </g>
      );
    case 'bill':
      // Billete con alitas, volando lejos
      return (
        <g className={floaty}>
          <g transform="translate(86 6) rotate(-14)">
            <path d="M0 6 q-7 -8 -10 -2 q4 1 10 5 M24 6 q7 -8 10 -2 q-4 1 -10 5" fill={SHINE} stroke={LINE} strokeWidth={1.2} />
            <rect width={24} height={13} rx={2} fill={MONEY} stroke={LINE} strokeWidth={1.5} />
            <circle cx={12} cy={6.5} r={3} fill={SHINE} />
          </g>
        </g>
      );
    case 'sparkles':
      return (
        <g className={floaty} fill={POP}>
          <path d="M14 14 l1.8 5 l5 1.8 l-5 1.8 l-1.8 5 l-1.8 -5 l-5 -1.8 l5 -1.8 Z" />
          <path d="M106 26 l1.4 3.6 l3.6 1.4 l-3.6 1.4 l-1.4 3.6 l-1.4 -3.6 l-3.6 -1.4 l3.6 -1.4 Z" />
        </g>
      );
    case 'sunglasses':
      return (
        <g>
          <path d="M33 56 L23 51 M87 56 L97 51 M55 58 H65" {...stroke} />
          <rect x={33} y={53} width={22} height={13} rx={5} fill={LINE} />
          <rect x={65} y={53} width={22} height={13} rx={5} fill={LINE} />
          <path d="M37 57 l5 -2 M69 57 l5 -2" stroke={SHINE} strokeWidth={2} strokeLinecap="round" />
        </g>
      );
    case 'paws':
      // Las manitos en la cara, como El grito
      return (
        <g fill={FUR} stroke={LINE} strokeWidth={2.5}>
          <ellipse cx={25} cy={84} rx={9} ry={12} />
          <ellipse cx={95} cy={84} rx={9} ry={12} />
        </g>
      );
    case 'shakeLines':
      return <path d="M8 52 q4 6 0 12 M14 48 q4 8 0 18 M112 52 q-4 6 0 12 M106 48 q-4 8 0 18" stroke={LINE} strokeWidth={2} strokeLinecap="round" fill="none" opacity={0.5} />;
  }
}

export function CatSvg({ emotion, className = '' }: { emotion: Emotion; className?: string }) {
  const face = FACES[emotion];
  const extras = face.extras ?? [];
  return (
    <svg viewBox="0 0 120 104" className={className} aria-hidden="true">
      {/* Orejas */}
      <path d="M24 54 L26 14 L54 34 Z M96 54 L94 14 L66 34 Z" fill={FUR} stroke={LINE} strokeWidth={3} strokeLinejoin="round" />
      <path d="M30 42 L31 23 L46 34 Z M90 42 L89 23 L74 34 Z" fill={BLUSH} />
      {/* Cabeza, rayitas y mejillas */}
      <ellipse cx={60} cy={64} rx={40} ry={34} fill={FUR} stroke={LINE} strokeWidth={3} />
      <path d="M60 32 V42 M50 33 L52 41 M70 33 L68 41" stroke={STRIPE} strokeWidth={3} strokeLinecap="round" />
      <ellipse cx={33} cy={75} rx={6} ry={3.5} fill={BLUSH} opacity={emotion === 'enamorado' ? 1 : 0.6} />
      <ellipse cx={87} cy={75} rx={6} ry={3.5} fill={BLUSH} opacity={emotion === 'enamorado' ? 1 : 0.6} />
      {/* Bigotes */}
      <path d="M30 70 L10 66 M30 75 L10 77 M90 70 L110 66 M90 75 L110 77" stroke={LINE} strokeWidth={1.5} strokeLinecap="round" opacity={0.7} />

      <Eye x={44} kind={face.eyes} />
      <Eye x={76} kind={face.eyes} />
      {face.brows && <Brows kind={face.brows} />}
      <path d="M56 70 L64 70 L60 75 Z" fill={BLUSH} stroke={LINE} strokeWidth={1.5} strokeLinejoin="round" />
      <Mouth kind={face.mouth} />

      {extras.map((kind) => (
        <Extra key={kind} kind={kind} />
      ))}
    </svg>
  );
}
