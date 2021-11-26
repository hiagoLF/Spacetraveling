import ptBR from 'date-fns/locale/pt-BR';
import { format } from 'date-fns';

function formatDate(date: string): string {
  const formatedDate = format(new Date(date), 'd MMM yyyy', {
    locale: ptBR,
  });

  return formatedDate;
}

export default formatDate;
