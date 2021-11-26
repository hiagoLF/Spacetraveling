import Link from 'next/link';
import styles from './header.module.scss';

const Header: React.FC = () => {
  return (
    <Link href="/">
      <a>
        <header className={styles.headerContainer}>
          <img src="/Logo.svg" alt="logo" />
        </header>
      </a>
    </Link>
  );
};

export default Header;
