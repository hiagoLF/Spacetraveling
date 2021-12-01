import ptBR from 'date-fns/locale/pt-BR';
import { format } from 'date-fns';

function formatHour(date: string): string {
  const formatedDate = format(new Date(date), 'HH:mm', {
    locale: ptBR,
  });

  return formatedDate;
}

export default formatHour;
