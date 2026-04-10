import './style.css';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import downloads from './config.json';

const contentWrapper = document.getElementById('content-wrapper');

function getCookie(name) {
    let match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? match[2] : null;
}

function setCookie(name, value, days) {
    let d = new Date();
    d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = name + "=" + value + ";path=/;expires=" + d.toGMTString();
}

let currentLang = getCookie('site_lang') || 'zh-CN';
setCookie('site_lang', currentLang, 365); // Initialize cookie if not exists

const langModules = import.meta.glob('./language/*.json');

const initLanguage = async () => {
    try {
        const loadLang = langModules[`./language/${currentLang}.json`];
        if (!loadLang) throw new Error('Language file not found: ' + currentLang);
        const langModule = await loadLang();
        const langData = langModule.default || langModule;
        
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const keys = key.split('.');
            let value = langData;
            keys.forEach(k => {
                value = value[k];
            });
            if (value) {
                el.innerText = value;
            }
        });

        // Update active class on dropdown options
        const activeBg = document.querySelector('.lang-active-bg');
        document.querySelectorAll('.lang-option').forEach(opt => {
            if (opt.getAttribute('data-lang') === currentLang) {
                opt.classList.add('active');
                // Calculate position for dynamic pill background
                const updateBg = () => {
                    if (activeBg && opt.offsetHeight > 0) {
                        activeBg.style.transform = `translateY(${opt.offsetTop}px)`;
                        activeBg.style.height = `${opt.offsetHeight}px`;
                    }
                };
                requestAnimationFrame(updateBg);
                // 字体加载完成或布局稳定后再次修正高度
                if (document.fonts && document.fonts.ready) {
                    document.fonts.ready.then(updateBg);
                }
                setTimeout(updateBg, 100);
            } else {
                opt.classList.remove('active');
            }
        });

        // 触发语言更改事件以更新 FAQ 等动态内容
        document.dispatchEvent(new Event('languageChanged'));
    } catch (error) {
        console.error('Failed to load language:', error);
    }
};

document.querySelectorAll('.lang-option').forEach(option => {
    option.addEventListener('click', (e) => {
        const newLang = e.target.getAttribute('data-lang');
        if (newLang !== currentLang) {
            currentLang = newLang;
            setCookie('site_lang', currentLang, 365);
            initLanguage();
        }
    });
});

// Initialize on load
initLanguage();

gsap.registerPlugin(ScrollTrigger);

document.addEventListener('DOMContentLoaded', () => {

    // Inject download buttons
    const downloadContainer = document.getElementById('download-section');
    
    // 硬编码平台名称显示
    const platforms = [
        {
            id: 'windows',
            name: 'Windows',
            className: 'btn-group-windows',
            links: [ 'x64 安装包', 'arm64 安装包', 'x64 便携版', 'arm64 便携版' ]
        },
        {
            id: 'linux',
            name: 'Linux',
            className: 'btn-group-linux',
            links: [ 'x64', 'arm64', 'loong64' ]
        },
        {
            id: 'macos',
            name: 'macOS',
            className: 'btn-group-macos',
            links: [ 'x64', 'arm64' ]
        }
    ];

    platforms.forEach(plat => {
        const btnGroup = document.createElement('div');
        btnGroup.className = `download-btn-group ${plat.className}`;
        
        const mainBtn = document.createElement('div');
        mainBtn.className = 'btn-main';
        mainBtn.innerHTML = `<span>${plat.name}</span>`;

        const details = document.createElement('div');
        details.className = `details details-${plat.id}`;
        
        const platData = downloads[plat.id] || {};
        details.innerHTML = plat.links.map(label => {
            const url = platData[label] || '#';
            return `<a href="${url}" target="_blank" class="detail-link">${label}</a>`;
        }).join('');

        btnGroup.appendChild(mainBtn);
        btnGroup.appendChild(details);
        
        downloadContainer.appendChild(btnGroup);
    });

    // Inject FAQ
    const faqContainer = document.getElementById('faq-list');
    const faqEmptyMsg = document.getElementById('faq-empty-msg');
    
    function renderFaq() {
        if (!faqContainer || !faqEmptyMsg) return;
        
        faqContainer.innerHTML = '';
        const faqs = downloads.faq && downloads.faq[currentLang] ? downloads.faq[currentLang] : [];
        if (faqs.length === 0) {
            faqEmptyMsg.style.display = 'block';
        } else {
            faqEmptyMsg.style.display = 'none';
            faqs.forEach(faq => {
                const faqItem = document.createElement('div');
                faqItem.className = 'faq-item-wrapper w-dyn-item';
                faqItem.innerHTML = `
                    <div class="top-faq-content">
                        <h3 class="h3-heading is-small">${faq.question}</h3>
                        <div class="plus-item_faq">
                            <div class="horizontal-line_plus"></div>
                            <div class="line-vertical-wrapper_plus">
                                <div class="line-vertical_plus"></div>
                            </div>
                        </div>
                    </div>
                    <div class="bottom-faq-content">
                        <div class="faq-description w-richtext">
                            <p>${faq.answer}</p>
                        </div>
                    </div>
                `;
                
                const topContent = faqItem.querySelector('.top-faq-content');
                const bottomContent = faqItem.querySelector('.bottom-faq-content');
                const plusItem = faqItem.querySelector('.plus-item_faq');
                const lineVerticalWrapper = faqItem.querySelector('.line-vertical-wrapper_plus');
                
                let isOpen = false;
                
                gsap.set(bottomContent, { height: 0, overflow: 'hidden' });
                gsap.set(plusItem, { rotationZ: 0 });
                gsap.set(lineVerticalWrapper, { rotationZ: 0 });
                
                topContent.addEventListener('click', () => {
                    isOpen = !isOpen;
                    if (isOpen) {
                        gsap.to(bottomContent, { height: 'auto', duration: 0.4, ease: 'power2.out' });
                        gsap.to(plusItem, { rotationZ: 360, duration: 0.4, ease: 'power2.out' });
                        gsap.to(lineVerticalWrapper, { rotationZ: 90, duration: 0.4, ease: 'power2.out' });
                    } else {
                        gsap.to(bottomContent, { height: 0, duration: 0.4, ease: 'power2.out' });
                        gsap.to(plusItem, { rotationZ: 0, duration: 0.4, ease: 'power2.out' });
                        gsap.to(lineVerticalWrapper, { rotationZ: 0, duration: 0.4, ease: 'power2.out' });
                    }
                });
                
                faqContainer.appendChild(faqItem);
            });
        }
    }
    renderFaq();
    document.addEventListener('languageChanged', renderFaq);

    let oldScroll = window.scrollY;
    const updateScrollDirection = (currentScroll) => {
        if (currentScroll > oldScroll) {
            document.body.classList.add('scrolling-down');
            document.body.classList.remove('scrolling-up');
        } else {
            document.body.classList.add('scrolling-up');
            document.body.classList.remove('scrolling-down');
        }
        oldScroll = currentScroll;
    };

    window.addEventListener('scroll', () => {
        const currentScroll = window.scrollY;
        updateScrollDirection(currentScroll);

        // Toggle class on body based on scroll position
        if (currentScroll > 300) {
            document.body.classList.add('scroll-past-300');
        } else {
            document.body.classList.remove('scroll-past-300');
        }
    });

    // [前方元素的动画]: 严格按照您的要求，仅在此处抽离初始化前方的历史效果，保证 Chunk 1/2 绝不受到任何影响。
    const allTextEls = document.querySelectorAll('.gsap-text');
    const allImgEls = document.querySelectorAll('.gsap-img');

    const topTextEls = Array.from(allTextEls).filter(el => el.closest('.chunk-1') || el.closest('.chunk-2'));
    topTextEls.forEach(el => {
        gsap.fromTo(el, {
            y: 50,
            opacity: 0
        }, {
            scrollTrigger: {
                trigger: el,
                start: "top 90%",
                once: true
            },
            y: 0,
            opacity: 1,
            duration: 1,
            ease: "power3.out"
        });
    });

    const topImgEls = Array.from(allImgEls).filter(el => el.closest('.chunk-1') || el.closest('.chunk-2'));
    topImgEls.forEach(el => {
        gsap.fromTo(el, {
            scale: 1.1,
            opacity: 0
        }, {
            scrollTrigger: {
                trigger: el,
                start: "top 90%",
                once: true
            },
            scale: 1,
            opacity: 1,
            duration: 1.5,
            ease: "expo.out"
        });
    });

    // Horizontal scroll
    const hScrollContainer = document.querySelector('.h-scroll-container');
    if (hScrollContainer) {
        
        gsap.to(hScrollContainer, {
            scrollTrigger: {
                trigger: "#chunk-1",
                /* [开始滚动的位置]:
                   "top 20%" 意味着当 `#chunk-1` 容器的顶部滑动到了浏览器视口顶部往下 20% 的高度时，才开始触发 fixed (固定)并执行左右滚动。
                */
                start: "top 10%",
                
                /* [控制页面滚动与水平滚动单元的滚动速度比例]:
                   由于我们改变了 start 并且让其横跨更长的实际距离，我们需要配置垂直划出的长度。
                   1.5 的系数表示：用户垂直向下滚动了 (实际水平移动宽度 * 1.5) 像素时，内容横向刚好走完了 100%。 
                   增大会减慢滚动速度，变小则滑得更快。
                */
                end: () => `+=${hScrollContainer.scrollWidth * 0.5}`,
                /* [控制高级感滚动延迟/惯性]:
                   将 scrub 数值从 1 提高到 2~3（比如 2.5），能极大地增加卷动停手后的物理惯性与平滑粘滞感：这就带来了“高级动画”的手感。
                */
                scrub: 1,  
                pin: true  
            },
            /* [控制最终停留的具体位置]
             * 为什么之前有巨大空隙？是因为最外层包裹的 `#chunk-1` 继承了 flex 中的 center！
             * 导致起点偏移量完全偏算了一大半。现在已在 CSS 里强制 `justify-content: flex-start`，
             * 这行 x 代码将能百分百完美运作，结束即贴死屏幕边缘，你可以通过微调 CSS 的 padding-right (如 5vw) 来控制恰好的收口空间。
             */
            x: () => -(hScrollContainer.scrollWidth - window.innerWidth),
            ease: "none"
        });
    }

    // Chunk 2 底部非线性滑入
    const chunk2 = document.querySelector('.chunk-2');
    if (chunk2) {
        gsap.from(chunk2, {
            scrollTrigger: {
                trigger: chunk2,
                /* 当 chunk 2 随页面滚动到屏幕下面 95%（刚刚漏出头）的时候立刻开始动画 */
                start: "top 95%", 
                toggleActions: "play none none reverse" /* 允许上下划时反复滑入滑出 */
            },
            y: 180,           /* 从物理下方 180px 开始发力上顶 */
            opacity: 0,
            duration: 1.4,
            /* [平滑非线性缓动] 
               取消了回弹动量，带来更平滑的滑入视觉体验。 
            */
            ease: "power3.out" 
        });
    }

    // 视差背景滚动效果 (让背景移动速度略低于前景)
    const parallaxBgs = document.querySelectorAll('.chunk-bg');
    parallaxBgs.forEach(bg => {
        gsap.fromTo(bg, 
            { yPercent: 0 }, 
            {
                yPercent: 60,
                ease: "none", /* 保持线性的位移速度差 */
                scrollTrigger: {
                    trigger: bg.parentElement,
                    start: "top bottom", /* 当父容器顶部刚进入视口底部时开始 */
                    end: "bottom top",   /* 当父容器底部完全离开视口顶部时结束 */
                    scrub: true          /* 绑定滚动进度，带惯性或即时跟随 */
                }
            }
        );
    });

    // === [由于置顶 Pin 而发生高度误算 Bug 修复专区] ===
    // 只要是处于水平滚动横向空间代码之后的元素，都会遭遇实际坐标偏移Bug！
    // 提取把 Chunk 3 以及后续（关于我们、FAQ等）单拿来在这最后的地方进行代码注册，它们就能精准获得真实的计算高度，在露出当前视口前绝不会再悄悄提前播放完毕了。
    const bottomTextEls = Array.from(allTextEls).filter(el => !el.closest('.chunk-1') && !el.closest('.chunk-2'));
    bottomTextEls.forEach(el => {
        gsap.fromTo(el, {
            y: 50,
            opacity: 0
        }, {
            scrollTrigger: { trigger: el, start: "top 90%", once: true },
            y: 0, opacity: 1, duration: 1, ease: "power3.out"
        });
    });

    const bottomImgEls = Array.from(allImgEls).filter(el => !el.closest('.chunk-1') && !el.closest('.chunk-2'));
    bottomImgEls.forEach(el => {
        gsap.fromTo(el, {
            scale: 1.1, opacity: 0
        }, {
            scrollTrigger: { trigger: el, start: "top 90%", once: true },
            scale: 1, opacity: 1, duration: 1.5, ease: "expo.out"
        });
    });

});
