import { useMemo } from 'react';
import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import Prismic from '@prismicio/client';
import { FiCalendar } from 'react-icons/fi';
import { FiUser } from 'react-icons/fi';
import { FiClock } from 'react-icons/fi';
import { useRouter } from 'next/router';
import Header from '../../components/Header';
import { getPrismicClient } from '../../services/prismic';
import styles from './post.module.scss';
import formatDate from '../../services/formatDate';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

const Post: React.FC<PostProps> = ({ post }) => {
  const readingTime = useMemo(() => {
    try {
      const time = (
        post.data.content.reduce((totalReadindTime, currentContent) => {
          const bodyWordsNumber = currentContent.body.reduce((acc, current) => {
            return acc + current.text.split(' ').length;
          }, 0);
          const titleWordsNumber = currentContent.heading.split(' ').length;

          return totalReadindTime + bodyWordsNumber + titleWordsNumber;
        }, 0) / 200
      ).toFixed();
      return time;
    } catch {
      return 0;
    }
  }, [post]);

  const router = useRouter();

  if (router.isFallback)
    return <div className={styles.loadingContainer}>Carregando...</div>;

  return (
    <>
      <Head>
        <title>Postagem | SpaceTraveling</title>
      </Head>
      <main>
        <Header />

        <header className={styles.headerContainer}>
          <img src={post.data.banner.url} alt={post.data.title} />

          <div className={styles.headerTextsContainer}>
            <h2>{post.data.title}</h2>
            <section>
              <time>
                <FiCalendar color="#BBBBBB" />
                {formatDate(post.first_publication_date)}
              </time>
              <address>
                <FiUser color="#BBBBBB" />
                {post.data.author}
              </address>
              <span>
                <FiClock color="#BBBBBB" />
                {readingTime} min
              </span>
            </section>
          </div>
        </header>

        <article className={styles.articleContainer}>
          {post.data.content.map(postContent => (
            <div key={postContent.heading}>
              <h3>{postContent.heading}</h3>
              {postContent.body.map((postBody, bodyIndex) => (
                // eslint-disable-next-line react/no-array-index-key
                <p key={bodyIndex}>{postBody.text}</p>
              ))}
            </div>
          ))}
        </article>
      </main>
    </>
  );
};

export default Post;

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['posts.uid'],
    }
  );

  const paths = posts.results.map(post => ({
    params: {
      slug: post.uid,
    },
  }));

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {});

  console.log('response to document >> ', response);

  const first_publication_date = formatDate(response.first_publication_date);

  const post: Post = {
    first_publication_date,
    data: response.data,
  };

  return {
    props: {
      post,
    },
    revalidate: 60 * 60, // 1 hour
  };
};
