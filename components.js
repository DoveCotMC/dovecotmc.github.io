import { design } from './design-data.js';

export function SiteHeader() {
  const switcher = '<div class="language-switch" role="group" aria-label="语言 / Language"><button type="button" data-language="zh_CN" aria-label="简体中文" aria-pressed="true">中</button><button type="button" data-language="en" aria-label="English" aria-pressed="false">EN</button></div>';
  return design.header.replace('</div></div></nav>', `${switcher}</div></div></nav>`);
}

export function FooterContent() {
  return design.footerContent;
}

export function SiteFooter(variant = 'standard') {
  return design.footerVariants[variant].replace('__FOOTER_CONTENT__', FooterContent());
}

export function FeatureCard({ openingTag, decoration = '', image, content }) {
  return `${openingTag}${decoration}${image}${content}</div>`;
}

export function HomeCarousel(slides = design.homeSlides) {
  const chevron = '<svg width="18" height="30" viewBox="0 0 18 30" fill="none" aria-hidden="true"><path d="M15 3L3 15L15 27" stroke="currentColor" stroke-width="2" stroke-linecap="square"/></svg>';
  return `<section class="home-carousel" data-component="home-carousel" aria-label="首页精选" aria-roledescription="轮播">
    <div class="home-carousel__viewport" id="home-carousel-slides" tabindex="0" aria-label="横向滚动切换首页精选">
      ${slides.map((slide, index) => `<article class="home-carousel__slide" role="group" aria-roledescription="幻灯片" aria-label="${index + 1} / ${slides.length}：${slide.name}" ${index ? 'aria-hidden="true" inert' : ''}>${slide.html}</article>`).join('')}
    </div>
    <button class="home-carousel__arrow home-carousel__arrow--previous" type="button" data-carousel-step="-1" aria-label="上一张" aria-controls="home-carousel-slides">${chevron}</button>
    <button class="home-carousel__arrow home-carousel__arrow--next" type="button" data-carousel-step="1" aria-label="下一张" aria-controls="home-carousel-slides">${chevron}</button>
    <div class="home-carousel__indicators" role="group" aria-label="轮播位置">
      ${slides.map((slide, index) => `<button class="home-carousel__indicator" type="button" data-carousel-index="${index}" aria-label="切换到${slide.name}" aria-controls="home-carousel-slides" ${index === 0 ? 'aria-current="true"' : ''}><span></span></button>`).join('')}
    </div>
    <span class="visually-hidden" data-carousel-status aria-live="polite" aria-atomic="true">1 / ${slides.length}：${slides[0].name}</span>
  </section>`;
}

export function SitePage(pathname) {
  const page = design.pages[pathname] ?? design.pages['/'];
  const body = page.body
    .replace('__HOME_CAROUSEL__', () => HomeCarousel())
    .replace('__SITE_FOOTER__', () => SiteFooter(page.footerVariant))
    .replace(/__FEATURE_CARD_(\d+)__/g, (_, index) => FeatureCard(page.features[Number(index)]));
  return {
    title: page.title,
    html: `${page.openingTag}${SiteHeader()}${body}</div>`,
  };
}

export const routes = Object.freeze(Object.keys(design.pages));
