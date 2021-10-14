import { useEffect, useRef, useState } from 'react';
import { ClipLoader } from 'react-spinners';
import { Popup } from 'react-tiny-modals';
import { urlList } from '../urlList';
import { DoubleLinkedList } from '../utils/doubleLinkedList';
import { getPageTitle } from '../utils/getPageTitle';
import { getRandomPages } from '../utils/getRandomPages';
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
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [startPage, setStartPage] = useState<Page>();
  const [targetPage, setTargetPage] = useState<Page>();
  const targetPageRef = useRef<Page>();
  targetPageRef.current = targetPage;
  const [currentPage, setCurrentPage] = useState<CurrentPage>({
    url: '',
    previousPage: null,
    nextPage: null,
  });

  const [easyMode, setEasyMode] = useState<boolean>(false);
  const easyModeRef = useRef<boolean>(easyMode);
  easyModeRef.current = easyMode;

  const [gameEnded, setGameEnded] = useState<boolean>(false);
  const newGame = () => {
    if (isLoading) return;
    setGameEnded(false);

    getRandomPages(2).then((pages) => {
      let startURL = urlList[randomInt(0, urlList.length - 1)];
      if (pages?.[0] && !easyModeRef.current) {
        startURL = pages[0];
      }
      getPageTitle(startURL).then((title) => {
        if (title) {
          setStartPage({ url: startURL, title });
          setClickedLinks(0);
        }
      });

      let targetURL = pages?.[1];
      if (!pages?.[1] || targetURL === startURL || easyModeRef.current) {
        do {
          targetURL = urlList[randomInt(0, urlList.length - 1)];
        } while (targetURL === startURL);
      }
      getPageTitle(targetURL!).then((title) => {
        if (title) {
          setTargetPage({ url: targetURL!, title });
        }
      });
      setCurrentPage({
        url: startURL,
        nextPage: null,
        previousPage: null,
      });
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
    if (currentPage.url === targetPageRef.current?.url) {
      setGameEnded(true);
      return;
    }

    if (!currentPage.url) return;
    setIsLoading(true);
    const currentIframe = iframe.current;

    const iframeDocument = currentIframe?.contentWindow?.document;
    if (!iframeDocument) return;
    const realOrigin = new URL(currentPage.url).origin;
    const onClick = (e: Event) => {
      const clickedElement = e.target as Element;
      const closestLink = clickedElement.closest('a');
      if (!clickedElement && !closestLink) return;
      let finalElement = clickedElement;
      if (!(clickedElement.tagName === 'A')) {
        if (!closestLink) return;
        finalElement = closestLink;
      }
      const dataHref = finalElement.getAttribute('data-href');
      if (!dataHref || dataHref === '/') return;
      if (dataHref[0] === '#') {
        const anchorTo = iframeDocument.querySelector(dataHref);
        if (anchorTo) {
          anchorTo.scrollIntoView();
        }
        return;
      }

      setClickedLinks(clickedLinksRef.current + 1);
      setCurrentPage({
        url: realOrigin + dataHref,
        previousPage: currentPage,
        nextPage: null,
      });
      currentIframe?.contentWindow?.scrollTo({ top: 0 });
    };
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
          Array.from(links).forEach((link) => {
            const rawHref = link.getAttribute('href');
            if (!link.href || !rawHref) return;
            const parsed = new URL(link.href);

            let finalHref = parsed.pathname + parsed.search;
            if (parsed.hash && rawHref[0] === '#') {
              finalHref = parsed.hash;
            }
            if (parsed.origin !== window.origin) {
              link.outerHTML = '<span>' + link.innerHTML + '</span>';
              return;
            }
            link.setAttribute('data-href', finalHref);
            link.removeAttribute('href');
          });
          iframeDocument.addEventListener('click', onClick);
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
      iframeDocument?.removeEventListener('click', onClick);
    };
  }, [currentPage]);

  return (
    <main>
      <div className="tool-bar">
        <table className="info-table">
          <tbody>
            <tr>
              <td>Start:</td>
              <td>
                <b>
                  <a href={startPage?.url} target="_blank" rel="noreferrer">
                    {startPage?.title}
                  </a>
                </b>
              </td>
            </tr>

            <tr>
              <td>Target:</td>
              <td>
                <b>
                  <a href={targetPage?.url} target="_blank" rel="noreferrer">
                    {targetPage?.title}
                  </a>
                </b>
              </td>
            </tr>
          </tbody>
        </table>
        <div className="game-options">
          <div className="easy-mode-wrap">
            <Popup
              content={() => (
                <div>
                  Pages get chosen from a limited list of Wikipedia articles.
                </div>
              )}
              innerStyle={{
                background: '#fff',
                width: '200px',
                padding: '5px',
                borderRadius: '5px',
                color: '#000',
              }}
              closeOnClickOutside={true}
              position={'top'}
            >
              {({ setShow }) => (
                <label
                  onClick={() => setShow(true)}
                  className="easy-mode-label"
                >
                  easy mode
                </label>
              )}
            </Popup>
            <input
              type="checkbox"
              onClick={newGame}
              checked={easyMode}
              onChange={(e) => setEasyMode(e.target.checked)}
            />
          </div>
          <button
            onClick={() => newGame()}
            className="new-game-btn"
            title="Generate a new game"
          >
            New game
          </button>
          <div className="link-counter">
            Links: <b>{clickedLinks}</b>
          </div>
        </div>
      </div>
      <div className="game">
        <div className="game-bar">
          <div>
            <button
              onClick={() => {
                if (isLoading) return;
                currentPage.previousPage &&
                  setCurrentPage({
                    ...currentPage.previousPage,
                    nextPage: currentPage,
                  });
              }}
              title="Go back in history"
            >
              &lt;
            </button>
            <button
              onClick={() => {
                if (isLoading) return;
                currentPage.nextPage && setCurrentPage(currentPage.nextPage);
              }}
              title="Go forward in history"
            >
              &gt;
            </button>
          </div>
          <div>
            <b>{currentPageName}</b>
          </div>
        </div>
        <div className="game-wrap">
          <iframe
            className={
              'game-window' + (isLoading || gameEnded ? ' hidden' : '')
            }
            ref={iframe}
            title="game window"
          />

          {gameEnded && (
            <div className="end-screen">
              <h2>You won!</h2>
              <div>clicked links: {clickedLinks}</div>
              <div>start: {startPage?.title}</div>
              <div>target: {targetPage?.title}</div>

              <button onClick={() => newGame()} className="new-game-btn">
                Play again
              </button>
            </div>
          )}
          {isLoading && <ClipLoader color="#ffff" size="60" />}
        </div>
      </div>
    </main>
  );
};

export default Game;
