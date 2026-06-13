import { CATEGORIE_VENDITA, CATEGORIE_COSTI } from '../../utils/constants';

const groupColors = {
  'Tabacchi': 'bg-amber-100 text-amber-800',
  'Valori Bollati': 'bg-blue-100 text-blue-800',
  'Servizi': 'bg-purple-100 text-purple-800',
  'Editoria': 'bg-teal-100 text-teal-800',
  'Accessori': 'bg-pink-100 text-pink-800',
  'Altro': 'bg-gray-100 text-gray-700',
  'fisso': 'bg-blue-100 text-blue-800',
  'variabile': 'bg-orange-100 text-orange-800',
  'straordinario': 'bg-red-100 text-red-800'
};

export default function CategoryBadge({ categoryId, type = 'vendita' }) {
  const categories = type === 'vendita' ? CATEGORIE_VENDITA : CATEGORIE_COSTI;
  const cat = categories.find(c => c.id === categoryId);
  if (!cat) return <span className="text-text-muted text-sm">{categoryId}</span>;

  const groupKey = type === 'vendita' ? cat.gruppo : cat.tipologia;
  const colorClass = groupColors[groupKey] || groupColors['Altro'];

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
      {cat.label}
    </span>
  );
}
