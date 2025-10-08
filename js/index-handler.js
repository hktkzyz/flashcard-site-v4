document.addEventListener('DOMContentLoaded', () => {
    if (!window.categoryData) {
        console.error('分类数据加载失败');
        return;
    }

    const container = document.getElementById('category-container');
    if (!container) {
        console.error('未找到卡片容器');
        return;
    }

    // 生成卡片并直接绑定事件
    Object.keys(window.categoryData).forEach(categoryKey => {
        const category = window.categoryData[categoryKey];
        const firstItem = category.items[0];
        if (!firstItem) return;

        const imageFileName = firstItem.word + '.jpg';
        const card = document.createElement('div');
        card.className = 'card-root card-category';
        card.dataset.href = `./category.html?type=${categoryKey}`;

        // 卡片内容
        card.innerHTML = `
            <div class="card-img-container">
                <img class="card-img" 
                     src="pic/${categoryKey}/${imageFileName}" 
                     alt="${categoryKey}类单词">
            </div>
            <div class="card-category-text">
                <p class="card-category__title">${category.title}</p>
                <p class="card-category__desc">${category.date} | ${category.items.length}</p>
            </div>
        `;

        // 直接给当前卡片绑定触摸事件（仅样式）
        card.addEventListener('touchend', (e) => {
            if (e.target.closest('.audio-btn')) return;
            setTimeout(() => {
                card.classList.add('end-test');
                setTimeout(() => card.classList.remove('end-test'), 300);
            }, 100);
        });

        // 直接给当前卡片绑定点击事件（跳转）
        card.addEventListener('click', () => {
            const targetUrl = card.dataset.href;
            if (!targetUrl) return;

            card.classList.add('end-test');
            // 使用setTimeout确保样式生效
            const timer = setTimeout(() => {
                window.location.href = targetUrl;
                clearTimeout(timer); // 清理定时器
            }, 1000); // 1秒延迟，足够看到效果
        });

        container.appendChild(card);
    });

    console.log('首页卡片生成完成');
});
