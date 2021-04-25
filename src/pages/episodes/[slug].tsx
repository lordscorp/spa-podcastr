import { format, parseISO } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import Image from 'next/image';
import { GetStaticProps, GetStaticPaths } from 'next';
import { useRouter } from 'next/router'
import { api } from '../../services/api';
import { convertDurationToTimeString } from '../../utils/convertDurationToTimeString';
import { Episode } from '../../types/Episode';
import Link from 'next/link';

import styles from './episode.module.scss'

type EpisodeProps = {
    episode: Episode;
}

export default function EpisodeElement({ episode }: EpisodeProps) {
    // Verifica se conteúdo ainda está sendo carregado (não é necessário porque o fallback do getStaticPaths está definido para 'blocking', então página será carregada no serverside)
    // const router = useRouter();

    // if (router.isFallback) {
    //     return <p>Carregando...</p>
    // }

    return (
        <div className={styles.episode}>
            <div className={styles.thumbnailContainer}>
                <Link href="/">
                    <button type="button">
                        <img src="/arrow-left.svg" alt="Voltar" />
                    </button>
                </Link>
                <Image
                    width={700}
                    height={160}
                    src={episode.thumbnail}
                    objectFit="cover"
                />
                <button type="button">
                    <img src="/play.svg" alt="Tocar" />
                </button>
            </div>
            <header>
                <h1>{episode.title}</h1>
                <span>{episode.members}</span>
                <span>{episode.publishedAt}</span>
                <span>{episode.durationAsString}</span>
            </header>
            <div
                className={styles.description}
                dangerouslySetInnerHTML={{ __html: episode.description }}
            />
        </div>
    )
}

export const getStaticPaths: GetStaticPaths = async () => {
    const { data } = await api.get('episodes', {
        params: {
            _limit: 2,
            _sort: 'published_at',
            _order: 'desc'
        }
    })

    const paths = data.map(episode => {
        return {
            params: {
                slug: episode.id
            }
        }
    })
    return {
        paths,
        fallback: 'blocking'
        // se o fallback for false, retorna 404 ao tentar acessar uma rota(página) não declarada nos paths
        // Se o fallback for true, renderiza no lado do client
    }
}

export const getStaticProps: GetStaticProps = async (contexto) => {
    const { slug } = contexto.params;
    const { data } = await api.get(`/episodes/${slug}`);

    const episode = {
        id: data.id,
        title: data.title,
        thumbnail: data.thumbnail,
        members: data.members,
        publishedAt: format(parseISO(data.published_at), 'd MMM yy', { locale: ptBR }),
        duration: Number(data.file.duration),
        durationAsString: convertDurationToTimeString(Number(data.file.duration)),
        description: data.description,
        url: data.file.url
    }

    return {
        props: {
            episode
        },
        revalidate: 60 * 60 * 24, // 24 horas
    }
}