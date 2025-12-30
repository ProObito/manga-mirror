
import aiohttp, re
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse, parse_qs

class RoliaScanSource:
    name = "roliascan"
    display_name = "RoliaScan"
    base_url = "https://roliascan.com"
    stype = "hub"

    @staticmethod
    async def _fetch_html(url):
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:97.0) Gecko/20100101 Firefox/97.0"
        }
        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=headers) as resp:
                return await resp.text()

    @classmethod
    async def search(cls, query):
        search_url = (
            f"{cls.base_url}/?s={query.replace(' ', '+')}"
            "&asp_active=1&p_asid=1&p_asp_data=1"
            "&asp_gen[]=title&asp_gen[]=exact"
            "&filters_initial=1&filters_changed=0&qtranslate_lang=0&current_page_id=-1"
        )
        html = await cls._fetch_html(search_url)
        soup = BeautifulSoup(html, "html.parser")
        results = []
        for post in soup.select(".col-12.post"):
            a_tag = post.find("a", href=True)
            title_tag = post.find("h4")
            span_year = post.find("span")
            if a_tag and title_tag:
                title = title_tag.get_text(strip=True)
                url = a_tag["href"]
                results.append({
                    "title": title,
                    "url": url
                })
        return results

    @classmethod
    async def get_info(cls, manga_url):
        html = await cls._fetch_html(manga_url)
        soup = BeautifulSoup(html, "html.parser")
        def find_table_value(label):
            for tr in soup.select("table.table tr"):
                th = tr.find("th")
                td = tr.find("td")
                if th and td and label.lower() in th.get_text(strip=True).lower():
                    return td.get_text(" ", strip=True)
            return None
        title_tag = soup.find("meta", property="og:title")
        if title_tag:
            title = title_tag.get("content", "").strip()
            if " - ROLIASCAN" in title:
                title = title.replace(" - ROLIASCAN", "")
            elif "- ROLIASCAN" in title:
                title = title.replace("- ROLIASCAN", "")
            title = title.strip(" -")
        summary = soup.find("meta", property="og:description")
        cover = soup.find("meta", property="og:image")
        year = None
        published = soup.find("meta", property="article:published_time")
        if published:
            year = published["content"][:4]
        genres = []
        genre_container = soup.select_one(".d-inline-block")
        if genre_container:
            genres = [a.get_text(strip=True) for a in genre_container.select("a.btn-custom")]

        year = find_table_value("year")
        status = find_table_value("status") 
        info = {
            "title": title if title else None,
            "summary": summary["content"] if summary else None,
            "genres": genres,
            "cover": cover["content"] if cover else None,
            "url": manga_url,
            "released": year,
            "status": status,
        }
        chapters = await cls.get_chapters(manga_url)
        chapters[::-1]
        info["chapters"] = chapters
        return info

    @classmethod
    async def get_chapters(cls, manga_url):
        m = re.search(r"/manga/([^/]+)/", manga_url)
        if not m:
            return []
        slug = m.group(1)
        chap_base_url = f"{cls.base_url}/manga/{slug}/chapterlist/"
        html = await cls._fetch_html(chap_base_url)
        soup = BeautifulSoup(html, "html.parser")
        chapters = cls._parse_chapterlist(soup)
        page_nav = soup.select(".chapter-list-pagination .pagination a.page-link")
        page_urls = set()
        max_page = 1
        for a in page_nav:
            href = a.get("href")
            if not href:
                continue
            parsed = urlparse(href)
            qs = parse_qs(parsed.query)
            if "chap_page" in qs:
                try:
                    page = int(qs["chap_page"][0])
                    max_page = max(max_page, page)
                    page_urls.add(href)
                except Exception:
                    continue
        for page_num in range(2, max_page+1):
            url = f"{chap_base_url}?chap_page={page_num}"
            html = await cls._fetch_html(url)
            soup = BeautifulSoup(html, "html.parser")
            chapters += cls._parse_chapterlist(soup)
        return chapters

    @staticmethod
    def _parse_chapterlist(soup):
        chapters = []
        for a in soup.select("a.chap-link,a.chapter-link,a[href*='/chapter-']"):
            ch_url = a.get("href")
            ch_title = a.get_text(strip=True)
            if not ch_url or not ch_title:
                continue
            if not "Read First Chapter" in ch_title:
                chapters.append((ch_title, ch_url))
        for a in soup.select("a[href*='/chapter-']"):
            if not any(ch_url == a.get("href") for _, ch_url in chapters):
                chapters.append((a.get_text(strip=True), a.get("href")))
        return chapters

    @classmethod
    async def get_chapter_images(cls, chapter_url):
        html = await cls._fetch_html(chapter_url)
        soup = BeautifulSoup(html, "html.parser")
        images = []
        og_img = soup.find("meta", property="og:image")
        if og_img and og_img["content"]:
            images.append(og_img["content"])

        for img in soup.select(".readerarea img,.chapter-content img,img[src*='vla.roliascan.com/']"):
            src = img.get("src")
            if src and src.startswith("http"):
                images.append(src)
        seen = set()
        images_ordered = []
        for img_url in images:
            if img_url not in seen:
                images_ordered.append(img_url)
                seen.add(img_url)
        return images_ordered

    @classmethod
    async def get_chapters_with_slug(cls, slug):
        url = f"{cls.base_url}/manga/{slug}/"
        return await cls.get_info
