import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import Prismic from '@prismicio/client';
import { FiCalendar } from 'react-icons/fi';
import { FiUser } from 'react-icons/fi';
import { FiClock } from 'react-icons/fi';
import Header from '../../components/Header';
import { getPrismicClient } from '../../services/prismic';
import commonStyles from '../../styles/common.module.scss';
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
                {post.first_publication_date}
              </time>
              <address>
                <FiUser color="#BBBBBB" />
                {post.data.author}
              </address>
              <span>
                <FiClock color="#BBBBBB" />4 min
              </span>
            </section>
          </div>
        </header>

        <article className={styles.articleContainer}>
          {post.data.content.map(postContent => (
            <div key={postContent.heading}>
              <h3>{postContent.heading}</h3>
              {postContent.body.map(postBody => (
                <p>{postBody.text}</p>
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
      slug: post.id,
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

  const first_publication_date = formatDate(response.first_publication_date);

  const post = {
    first_publication_date,
    data: response.data,
  };

  return {
    props: {
      post,
    },
    revalidate: 60 * 60 * 24, // 24 hours
  };
};
