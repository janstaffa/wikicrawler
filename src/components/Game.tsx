import { useEffect, useRef, useState } from 'react';
import { ClipLoader } from 'react-spinners';
import { urlList } from '../urlList';
import { DoubleLinkedList } from '../utils/doubleLinkedList';
import { getPageTitle } from '../utils/getPageTitle';
import { randomInt } from '../utils/randomInt';

interface Page {
  title: string;
  url: string;
}

interface CurrentPage {
  url: string;
  previousPage: CurrentPage | null;
  nextPage: CurrentPage | null;
}

const Game: React.FC = () => {
  const [clickedLinks, setClickedLinks] = useState<number>(0);
  const clickedLinksRef = useRef<number>(clickedLinks);
  clickedLinksRef.current = clickedLinks;
  const incrementClickedLinks = () => {
    setClickedLinks(clickedLinks + 1);
  };
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [startPage, setStartPage] = useState<Page>();
  const [targetPage, setTargetPage] = useState<Page>();
  const [currentPage, setCurrentPage] = useState<CurrentPage>({
    url: '',
    previousPage: null,
    nextPage: null,
  });

  const newGame = () => {
    const startURL = urlList[randomInt(0, urlList.length - 1)];
    getPageTitle(startURL).then((title) => {
      if (title) {
        setStartPage({ url: startURL, title });
      }
    });

    let targetURL = '';
    do {
      targetURL = urlList[randomInt(0, urlList.length - 1)];
    } while (targetURL === startURL);
    getPageTitle(targetURL).then((title) => {
      if (title) {
        setTargetPage({ url: targetURL, title });
      }
    });

    setCurrentPage({
      url: startURL,
      nextPage: null,
      previousPage: null,
    });
  };
  useEffect(() => {
    newGame();
  }, []);
  const [currentPageName, setCurrentPageName] = useState<string>('');

  const iframe = useRef<HTMLIFrameElement>(null);

  const pageHistory = useRef<DoubleLinkedList>();
  pageHistory.current = new DoubleLinkedList();
  useEffect(() => {
    if (currentPage.url === targetPage?.url) {
      alert('You win!');
    }
    setIsLoading(true);
    const currentIframe = iframe.current;

    fetch(currentPage.url)
      .then((data) => data.text())
      .then((data) => {
        const _document = document.createElement('html');
        _document.innerHTML = data;

        const newPage = document.createElement('html');
        const newHead = document.createElement('head');
        const newBody = document.createElement('body');
        const head = _document.querySelector('head');
        const title = _document.querySelector(
          '#firstHeading'
        ) as HTMLHeadingElement;
        const body = _document.querySelector('#bodyContent');

        if (!head || !body) return;

        if (title) {
          title.style.marginTop = '0';
          newBody.prepend(title);
          setCurrentPageName(title.innerText);
        }
        const headLinks = head.querySelectorAll(
          'link[rel="stylesheet"]'
        ) as NodeListOf<HTMLLinkElement>;
        if (headLinks) {
          const origin = new URL(currentPage.url).origin;
          Array.from(headLinks).forEach((link) => {
            const parsed = new URL(link.href);
            if (parsed.origin !== window.origin) return;
            link.href = origin + parsed.pathname + parsed.search;
          });
        }
        newHead.appendChild(head);

        const toRemove: Element[] = [];
        const removeSections = body.querySelectorAll('.mw-editsection');
        toRemove.push(...Array.from(removeSections));
        const navBoxes = body.querySelectorAll('.navbox, .navbox2');
        toRemove.push(...Array.from(navBoxes));
        const categories = body.querySelector('#catlinks');
        if (categories) {
          toRemove.push(categories);
        }
        if (toRemove && toRemove.length > 0) {
          toRemove.forEach((el) => el.remove());
        }

        const newLinks = body.querySelectorAll('a.new');
        Array.from(newLinks).forEach((el) => {
          el.classList.remove('new');
          el.outerHTML = '<span>' + el.innerHTML + '</span>';
        });
        const links = body.getElementsByTagName('a');
        if (links) {
          const origin = new URL(currentPage.url).origin;
          Array.from(links).forEach((link) => {
            if (!link.href) return;
            const parsed = new URL(link.href);

            if (parsed.origin !== window.origin) {
              link.outerHTML = '<span>' + link.innerHTML + '</span>';
              return;
            }
            link.setAttribute('data-href', parsed.pathname + parsed.search);
            link.removeAttribute('href');
            currentIframe?.contentWindow?.document.addEventListener(
              'click',
              (e) => {
                if (
                  e.target &&
                  (e.target as Element).outerHTML === link.outerHTML
                ) {
                  incrementClickedLinks();
                  setCurrentPage({
                    url: origin + link.getAttribute('data-href'),
                    previousPage: currentPage,
                    nextPage: null,
                  });
                  currentIframe?.contentWindow?.scrollTo({ top: 0 });
                }
              }
            );
          });
        }

        newBody.appendChild(body);
        newBody.style.padding = '10px';
        newPage.append(newHead, newBody);

        if (!newPage) return;
        const iframeHTML =
          currentIframe?.contentWindow?.document.querySelector('html');
        if (!iframeHTML) return;
        iframeHTML.innerHTML = newPage.outerHTML;
        setIsLoading(false);
      });

    return () => {
      const doc = currentIframe?.contentWindow?.document.documentElement;
      if (doc) {
        doc.innerHTML = '';
      }
    };
  }, [currentPage, targetPage]);

  return (
    <main>
      <div className="tool-bar">
        <table className="info-table">
          <tbody>
            <tr>
              <td>Starting page:</td>
              <td>
                <b>{startPage?.title}</b>
              </td>
            </tr>
            <tr>
              <td>Current page:</td>
              <td>
                <b>{currentPageName}</b>
              </td>
            </tr>
            <tr>
              <td>Target page:</td>
              <td>
                <b>{targetPage?.title}</b>
              </td>
            </tr>
          </tbody>
        </table>
        <div>
          <button onClick={() => newGame()}>New game</button>
          <div className="link-counter">
            Links: <b>{clickedLinks}</b>
          </div>
        </div>
      </div>
      <div className="game">
        <div className="history-bar">
          <button
            onClick={() => {
              if (isLoading) return;
              currentPage.previousPage &&
                setCurrentPage({
                  ...currentPage.previousPage,
                  nextPage: currentPage,
                });
            }}
          >
            &lt;
          </button>
          <button
            onClick={() => {
              if (isLoading) return;
              currentPage.nextPage && setCurrentPage(currentPage.nextPage);
            }}
          >
            &gt;
          </button>
        </div>
        <div className="game-wrap">
          <iframe
            className={'game-window' + (isLoading ? ' hidden' : '')}
            ref={iframe}
            title="game window"
          />

          {isLoading && <ClipLoader color="#ffff" size="60" />}
        </div>
      </div>
    </main>
  );
};

export default Game;
