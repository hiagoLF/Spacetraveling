import ApiSearchResponse from '@prismicio/client/types/ApiSearchResponse';
import formatDate from './formatDate';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

function formatPostIndexes(postsResponse: ApiSearchResponse): Post[] {
  const postsFormated = postsResponse.results.map(post => ({
    uid: post.uid,
    first_publication_date: post.first_publication_date,
    data: {
      title: post.data.title,
      subtitle: post.data.subtitle,
      author: post.data.author,
    },
  }));
  return postsFormated;
}

export default formatPostIndexes;
