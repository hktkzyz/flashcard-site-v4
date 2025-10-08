// 等待DOM完全加载后执行
document.addEventListener('DOMContentLoaded', () => {
    // ---------------------- 步骤1：初始化准备 ----------------------
    // 从URL参数获取当前分类类型
    const urlParams = new URLSearchParams(window.location.search);
    const currentType = urlParams.get('type');

    // 验证分类是否有效
    if (!currentType || !window.categoryData[currentType]) {
        const cardContainer = document.getElementById('flash-card');
        if (cardContainer) {
            cardContainer.innerHTML = '<div class="error-message">分类不存在，请返回主页</div>';
        }
        console.error('无效的分类类型：', currentType);
        return;
    }

    // 获取当前分类数据并初始化索引
    const currentCategory = window.categoryData[currentType];
    let currentIndex = 0;
    const totalItems = currentCategory.items.length;

    // 存储基础状态到全局
    window.categoryState = {
        currentType,
        currentCategory,
        currentIndex,
        totalItems
    };

    console.log('初始化完成：', {
        分类类型: currentType,
        总条目数: totalItems,
        当前索引: currentIndex
    });


    // ---------------------- 步骤2：获取页面元素 ----------------------
    // 核心容器与标题元素
    const pageTitle = document.getElementById('page-title');
    const flashCard = document.getElementById('flash-card');
    const flashCardDots = document.getElementById('flash-card-dots');

    // 闪卡内容元素（图片和文字）
    const flashCardImg = document.getElementById('flash-card-img'); // 切换交互的核心元素
    const flashCardWordEn = document.getElementById('flash-card-word-en');
    const flashCardWordPhonetic = document.getElementById('flash-card-word-phonetic');
    const flashCardWordCn = document.getElementById('flash-card-word-cn');
    const flashCardSentence = document.getElementById('flash-card-sentence');

    // 音频按钮元素
    const flashCardAudioUk = document.getElementById('flash-card-audio-uk');
    const flashCardAudioUs = document.getElementById('flash-card-audio-us');

    // 检查是否有元素缺失
    const requiredElements = [
        pageTitle, flashCard, flashCardDots,
        flashCardImg, flashCardWordEn, flashCardWordPhonetic,
        flashCardWordCn, flashCardSentence,
        flashCardAudioUk, flashCardAudioUs
    ];

    const missingElements = requiredElements.filter(el => !el);
    if (missingElements.length > 0) {
        console.error('以下元素缺失，请检查 HTML ID：', missingElements);
        return;
    }

    // 缓存元素到全局
    window.cardElements = {
        pageTitle,
        flashCard,
        flashCardDots,
        flashCardImg,
        flashCardWordEn,
        flashCardWordPhonetic,
        flashCardWordCn,
        flashCardSentence,
        flashCardAudioUk,
        flashCardAudioUs
    };

    console.log('页面元素获取完成：', {
        已获取元素数量: requiredElements.length
    });


    // ---------------------- 新增：本地存储相关功能 ----------------------
    // 1. 生成唯一的存储键（避免不同分类冲突）
    function getStorageKey() {
        const { currentType } = window.categoryState;
        return `flashcard_current_index_${currentType}`; // 格式：flashcard_current_index_水果
    }

    // 2. 从本地存储读取索引（页面加载时用）
    function loadIndexFromStorage() {
        const storageKey = getStorageKey();
        const savedIndex = localStorage.getItem(storageKey);
        if (savedIndex !== null) {
            // 验证保存的索引是否有效（在合理范围内）
            const { totalItems } = window.categoryState;
            const parsedIndex = parseInt(savedIndex, 10);
            if (parsedIndex >= 0 && parsedIndex < totalItems) {
                window.categoryState.currentIndex = parsedIndex;
                console.log('从本地存储恢复索引：', parsedIndex);
            }
        }
    }

    // 3. 保存当前索引到本地存储（切换单词时用）
    function saveIndexToStorage() {
        const storageKey = getStorageKey();
        const { currentIndex } = window.categoryState;
        localStorage.setItem(storageKey, currentIndex.toString());
        console.log('保存索引到本地存储：', currentIndex);
    }


    // ---------------------- 步骤3：实现卡片更新函数 ----------------------
    function updateCard() {
        const { currentCategory, currentIndex } = window.categoryState;
        const {
            pageTitle,
            flashCardImg,
            flashCardWordEn,
            flashCardWordPhonetic,
            flashCardWordCn,
            flashCardSentence
        } = window.cardElements;

        const currentItem = currentCategory.items[currentIndex];

        // 更新页面标题
        pageTitle.textContent = currentCategory.title;

        // 更新图片（处理空格，与首页逻辑一致）
        const imageFileName = currentItem.word + '.jpg'; // 若图片用-代替空格，可加 .replace(/\s+/g, '-')
        flashCardImg.src = `pic/${currentType}/${imageFileName}`;
        flashCardImg.alt = `${currentItem.chinese}图片`;

        // 1. 先清空所有优先级类名（避免样式叠加）
        flashCardWordEn.classList.remove('card-word__en--required', 'card-word__en--extended');
        // 2. 根据 priority 加对应的类名
        if (currentItem.priority === 1) {
            flashCardWordEn.classList.add('card-word__en--required');
        } else if (currentItem.priority === 2) {
            flashCardWordEn.classList.add('card-word__en--extended');
        }

        // 更新文字内容
        flashCardWordEn.textContent = currentItem.word;
        flashCardWordPhonetic.textContent = currentItem.phonetic;
        flashCardWordCn.textContent = currentItem.chinese;
        flashCardSentence.textContent = currentItem.sentence;

        console.log('卡片更新完成：', {
            当前条目: currentItem.word,
            当前索引: currentIndex
        });
    }

    // 先从本地存储加载索引，再初始渲染卡片
    loadIndexFromStorage();
    updateCard();


    // ---------------------- 步骤4：实现进度圆点功能 ----------------------
    // 生成圆点
    function createDots() {
        const { flashCardDots } = window.cardElements;
        const { totalItems } = window.categoryState;

        flashCardDots.innerHTML = '';

        for (let i = 0; i < totalItems; i++) {
            const dot = document.createElement('div');
            dot.className = 'dot';
            dot.dataset.index = i;

            if (i === window.categoryState.currentIndex) {
                dot.classList.add('active');
            }

            flashCardDots.appendChild(dot);
        }
    }

    // 更新圆点高亮
    function updateDots() {
        const { flashCardDots } = window.cardElements;
        const { currentIndex } = window.categoryState;
        const allDots = flashCardDots.querySelectorAll('.dot');

        allDots.forEach((dot, index) => {
            if (index === currentIndex) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }

    // 圆点点击跳转（添加保存索引功能）
    function bindDotClickEvent() {
        const { flashCardDots } = window.cardElements;

        flashCardDots.addEventListener('click', (e) => {
            if (e.target.classList.contains('dot')) {
                const targetIndex = parseInt(e.target.dataset.index);
                window.categoryState.currentIndex = targetIndex;
                updateCard();
                updateDots();
                saveIndexToStorage(); // 点击圆点跳转后保存索引
                console.log('点击圆点，跳转到条目索引：', targetIndex);
            }
        });
    }

    // 初始化圆点
    createDots();
    bindDotClickEvent();


    // ---------------------- 步骤5：绑定交互事件（核心调整） ----------------------
    // 1. 图片点击切换条目（替代原卡片点击）
    function bindImageClickEvent() {
        const { flashCardImg } = window.cardElements;
        const { totalItems } = window.categoryState;

        flashCardImg.addEventListener('click', (e) => {
            // 阻止浏览器默认预览行为并修复顺序错乱
            e.preventDefault();
            e.stopImmediatePropagation();
            if (e.target.tagName !== 'IMG') return;

            // 计算图片宽度和点击位置
            const imgWidth = flashCardImg.offsetWidth;
            const clickX = e.clientX - flashCardImg.getBoundingClientRect().left;

            // 更新索引（左半区上一张，右半区下一张）
            if (clickX < imgWidth / 2) {
                window.categoryState.currentIndex =
                    window.categoryState.currentIndex - 1 < 0
                        ? totalItems - 1
                        : window.categoryState.currentIndex - 1;
                console.log('点击图片左半区，切换到上一张');
            } else {
                window.categoryState.currentIndex =
                    window.categoryState.currentIndex + 1 >= totalItems
                        ? 0
                        : window.categoryState.currentIndex + 1;
                console.log('点击图片右半区，切换到下一张');
            }

            // 刷新内容并保存索引
            updateCard();
            updateDots();
            saveIndexToStorage(); // 图片点击切换后保存索引
        });
    }

    // 2. 音频按钮播放功能（合并本地和网络播放逻辑）
    function bindAudioPlayEvent() {
        const { flashCardAudioUk, flashCardAudioUs } = window.cardElements;

        /**
         * 统一音频播放函数
         * @param {number} source - 音频来源：1=本地，2=网络
         * @param {number} type - 发音类型：1=英音，2=美音
         */
        function playAudio(source, type) {
            const { currentCategory, currentIndex, currentType } = window.categoryState;
            const currentWord = currentCategory.items[currentIndex].word;
            let audioUrl;

            // 根据来源构造不同的音频路径
            if (source === 1) {
                // 本地音频路径（按 "单词_类型.mp3" 命名，如 "apple pie_1.mp3"）
                audioUrl = `audio/${currentType}/${currentWord}_${type}.mp3`;
            } else if (source === 2) {
                // 网络音频路径（有道接口，type参数对应英美音）
                audioUrl = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(currentWord)}&type=${type}`;
            } else {
                console.error('无效的音频来源，必须是1（本地）或2（网络）');
                return;
            }

            // 播放音频（共用逻辑）
            const audio = new Audio(audioUrl);
            audio.play().catch(err => {
                console.error(`音频播放失败（来源：${source === 1 ? '本地' : '网络'}）：`, err);
                alert(`${source === 1 ? '本地' : '网络'}音频加载失败，请检查文件或网络～`);
            });
        }

        // 英音按钮（默认本地，切换网络只需改第一个参数为2）
        flashCardAudioUk.addEventListener('click', (e) => {
            e.stopPropagation();
            //playAudio(1, 1); // 本地英音（1=本地，1=英音）
            playAudio(2, 1); // 如需网络英音，启用此行
            console.log('播放英音：', window.categoryState.currentCategory.items[window.categoryState.currentIndex].word);
        });

        // 美音按钮（默认本地，切换网络只需改第一个参数为2）
        flashCardAudioUs.addEventListener('click', (e) => {
            e.stopPropagation();
            //playAudio(1, 2); // 本地美音（1=本地，2=美音）
            playAudio(2, 2); // 如需网络美音，启用此行
            console.log('播放美音：', window.categoryState.currentCategory.items[window.categoryState.currentIndex].word);
        });
    }


    // ---------------------- 新增：融合 card-handler.js 的逻辑 ----------------------
    // 3. 卡片触摸样式（原 card-handler.js 的 touchend 事件）
    function bindCardTouchStyle() {
        const cards = document.querySelectorAll('.card-root');
        cards.forEach(card => {
            card.addEventListener('touchend', (e) => {
                // 关键判断：触摸音频按钮时，不执行样式变化（与音频逻辑联动）
                if (e.target.closest('.flash-card__audio')) return;

                // 非音频按钮区域，100ms 后添加样式
                setTimeout(() => {
                    card.classList.add('end-test');
                    // 300ms 后移除样式（避免样式残留）
                    setTimeout(() => card.classList.remove('end-test'), 300);
                }, 100);
            });
        });
    }

    // 4. 卡片点击跳转（原 card-handler.js 的 click 事件，如分类卡片跳转）
    function bindCardClickJump() {
        const cards = document.querySelectorAll('.card-root');
        cards.forEach(card => {
            card.addEventListener('click', function () {
                const targetUrl = this.dataset.href;
                // 仅当有跳转地址且点击的不是图片/音频时执行（避免与图片切换冲突）
                if (targetUrl && !this.contains(flashCardImg) && !e.target.closest('.flash-card__audio')) {
                    this.classList.add('end-test');
                    setTimeout(() => {
                        window.location.href = targetUrl;
                    }, 1000); // 1秒延迟，确保样式展示
                }
            });
        });
    }

    // ---------------------- 执行所有事件绑定 ----------------------
    bindImageClickEvent();    // 图片点击切换（核心）
    bindAudioPlayEvent();     // 音频播放
    bindCardTouchStyle();     // 卡片触摸样式（融合自 card-handler）
    bindCardClickJump();      // 卡片点击跳转（融合自 card-handler）


    // ---------------------- 初始化完成 ----------------------
    console.log('分类页面所有功能初始化完成！支持：1.图片左右点击切换 2.音频播放 3.进度圆点跳转 4.刷新保持当前位置 5.触摸样式 6.卡片跳转');
});