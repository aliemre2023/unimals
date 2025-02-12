import { AppProps } from 'next/app';
import 'primereact/resources/themes/saga-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import 'primeflex/primeflex.css';
import '../styles/globals.css';
import '../styles/styles.css'; 
import Head from 'next/head';


function MyApp({ Component, pageProps }: AppProps) {
    return (
        <>
            <Head>
                <title>Unimals 🐕</title>
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <Component {...pageProps} />
        </>
    );
}

export default MyApp;