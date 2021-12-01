import { useState } from 'react';
import { GetStaticProps } from 'next';
import { FiCalendar } from 'react-icons/fi';
import { FiUser } from 'react-icons/fi';
import Prismic from '@prismicio/client';
import Link from 'next/link';
import Head from 'next/head';
import { getPrismicClient } from '../services/prismic';
import styles from './home.module.scss';
import formatPostIndexes from '../services/formatPostIndexes';
import formatDate from '../services/formatDate';

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
  preview: boolean;
}

const Home: React.FC<HomeProps> = ({ postsPagination, preview }) => {
  const [nextPage, setNextPage] = useState(postsPagination.next_page);
  const [posts, setPosts] = useState<Post[]>(postsPagination.results);

  async function handleMorePostsButtonClick(): Promise<void> {
    const result = await fetch(nextPage);
    const prismicResult = await result.json();
    const newPosts = formatPostIndexes(prismicResult);

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
              <Link href={`/post/${post.uid}`}>
                <a>
                  <h3>{post.data.title}</h3>
                  <p>{post.data.subtitle}</p>
                  <div>
                    <time>
                      <FiCalendar /> {formatDate(post.first_publication_date)}
                    </time>
                    <address>
                      <FiUser /> {post.data.author}
                    </address>
                  </div>
                </a>
              </Link>
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

        {preview && (
          <aside className={styles.exitPreview}>
            <Link href="/api/exit-preview">
              <a>Sair do modo Preview</a>
            </Link>
          </aside>
        )}
      </main>
    </>
  );
};

export default Home;

export const getStaticProps: GetStaticProps = async ({
  preview = false,
  previewData,
}) => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['posts.title', 'posts.subtitle', 'posts.author'],
      pageSize: 1,
      ref: previewData?.ref ?? null,
      orderings: '[document.first_publication_date desc]',
    }
  );

  const postsFormated = formatPostIndexes(postsResponse);

  return {
    props: {
      postsPagination: {
        next_page: postsResponse.next_page,
        results: postsFormated,
      },
      preview,
    },
    revalidate: 60 * 60, // 1 hour
  };
};
