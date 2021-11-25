import { useCallback, useState } from 'react';
import { GetStaticProps } from 'next';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import Prismic from '@prismicio/client';
import Head from 'next/head';
import { getPrismicClient } from '../services/prismic';
// import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

const Home: React.FC<HomeProps> = ({ postsPagination }) => {
  const [nextPage, setNextPage] = useState(postsPagination.next_page);
  const [posts, setPosts] = useState<Post[]>(postsPagination.results);

  async function handleMorePostsButtonClick(): Promise<void> {
    const result = await fetch(nextPage);
    const prismicResult = await result.json();
    const newPosts = prismicResult.results.map(post => ({
      uid: post.uid,
      first_publication_date: format(
        new Date(post.first_publication_date),
        'd MMM yyyy',
        {
          locale: ptBR,
        }
      ),
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    }));
    setNextPage(prismicResult.next_page);
    setPosts([...posts, ...newPosts]);
  }

  return (
    <>
      <Head>
        <title>Início | Spacetraveling</title>
      </Head>
      <main className={styles.homeContainer}>
        <header className={styles.headerContainer}>
          <img src="/Logo.svg" alt="logo" />
        </header>

        <ul className={styles.postsContainer}>
          {posts.map(post => (
            <li key={post.uid}>
              <h3>{post.data.title}</h3>
              <p>{post.data.subtitle}</p>
              <div>
                <time>
                  <img src="/icons/calendar.svg" alt="calendar" />
                  {post.first_publication_date}
                </time>
                <address>
                  <img src="/icons/user.svg" alt="calendar" />
                  {post.data.author}
                </address>
              </div>
            </li>
          ))}
        </ul>

        {nextPage && (
          <button
            className={styles.morePostsButton}
            type="button"
            onClick={handleMorePostsButtonClick}
          >
            <a>Carregar mais posts</a>
          </button>
        )}
      </main>
    </>
  );
};

export default Home;

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['posts.title', 'posts.subtitle', 'posts.author'],
      pageSize: 1,
    }
  );

  const postsFormated = postsResponse.results.map(post => ({
    uid: post.uid,
    first_publication_date: format(
      new Date(post.first_publication_date),
      'd MMM yyyy',
      {
        locale: ptBR,
      }
    ),
    data: {
      title: post.data.title,
      subtitle: post.data.subtitle,
      author: post.data.author,
    },
  }));

  return {
    props: {
      postsPagination: {
        next_page: postsResponse.next_page,
        results: postsFormated,
      },
    },
  };
};
