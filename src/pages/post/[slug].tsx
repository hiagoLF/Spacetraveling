import { useEffect, useMemo } from 'react';
import { GetStaticPaths, GetStaticProps } from 'next';
import Link from 'next/link';
import Head from 'next/head';
import Prismic from '@prismicio/client';
import { FiCalendar } from 'react-icons/fi';
import { FiUser } from 'react-icons/fi';
import { FiClock } from 'react-icons/fi';
import { useRouter } from 'next/router';
import PrismicDOM from 'prismic-dom';
import Header from '../../components/Header';
import { getPrismicClient } from '../../services/prismic';
import styles from './post.module.scss';
import formatDate from '../../services/formatDate';
import formatHour from '../../services/formatHour';

interface PostNavigationProps {
  uid: string;
  title: string;
}

interface Post {
  first_publication_date: string | null;
  last_publication_date: string | null;
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
  navigation: {
    prevPost: PostNavigationProps;
    nextPost: PostNavigationProps;
  };
}

const Post: React.FC<PostProps> = ({ post, navigation }) => {
  const router = useRouter();

  const readingTime = useMemo(() => {
    if (!post?.data?.content) return 0;

    const wordsNumber = post.data.content.reduce(
      (wordsAccumulator, currentContent) => {
        const bodyWordsNumber = PrismicDOM.RichText.asText(
          currentContent.body
        ).split(' ').length;

        const titleWordsNumber = currentContent.heading.split(' ').length;

        return wordsAccumulator + bodyWordsNumber + titleWordsNumber;
      },
      0
    );
    return Math.ceil(wordsNumber / 200);
  }, [post]);

  const edited = useMemo(() => {
    if (post.last_publication_date !== post.first_publication_date) {
      return undefined;
    }
    return {
      date: formatDate(post.last_publication_date),
      hour: formatHour(post.last_publication_date),
    };
  }, [post.last_publication_date]);

  console.log(edited);

  useEffect(() => {
    const script = document.createElement('script');
    const anchor = document.getElementById('inject-comments-for-uterances');
    script.setAttribute('src', 'https://utteranc.es/client.js');
    script.setAttribute('crossorigin', 'anonymous');
    script.setAttribute('async', 'true');
    script.setAttribute(
      'repo',
      process.env.NEXT_PUBLIC_COMMENTS_UTERANC_GITHUB_REPO
    );
    script.setAttribute('issue-term', 'url');
    script.setAttribute('theme', 'photon-dark');
    anchor.appendChild(script);
  }, []);

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
            {edited && (
              <h4>
                * editado em {edited.date}, às {edited.hour}
              </h4>
            )}
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

        <div className={styles.navigation}>
          <div className={styles.prev}>
            {navigation.prevPost && (
              <Link href={`/post/${navigation.prevPost.uid}`}>
                <a className={styles.prev}>
                  <span>{navigation.prevPost.title}</span>
                  <b>Post anterior</b>
                </a>
              </Link>
            )}
          </div>

          <div>
            {navigation.nextPost && (
              <Link href={`/post/${navigation.nextPost.uid}`}>
                <a className={styles.next}>
                  <span>{navigation.nextPost.title}</span> <b>Próximo post</b>
                </a>
              </Link>
            )}
          </div>
        </div>

        <div id="inject-comments-for-uterances" />
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

export const getStaticProps: GetStaticProps = async ({
  params,
  previewData,
}) => {
  const { slug } = params;
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {
    ref: previewData?.ref ?? null,
  });

  const nextPost = (
    await prismic.query(Prismic.predicates.at('document.type', 'posts'), {
      pageSize: 1,
      after: `${response.id}`,
      orderings: '[document.first_publication_date desc]',
      fetch: ['posts.uid', 'posts.title'],
    })
  ).results[0];

  const prevPost = (
    await prismic.query(Prismic.predicates.at('document.type', 'posts'), {
      pageSize: 1,
      after: `${response.id}`,
      orderings: '[document.first_publication_date]',
      fetch: ['posts.uid', 'posts.title'],
    })
  ).results[0];

  return {
    props: {
      post: response,
      navigation: {
        prevPost: prevPost
          ? {
              uid: prevPost.uid,
              title: prevPost.data.title,
            }
          : null,
        nextPost: nextPost
          ? {
              uid: nextPost.uid,
              title: nextPost.data.title,
            }
          : null,
      },
    },
    revalidate: 60 * 60, // 1 hour
  };
};
