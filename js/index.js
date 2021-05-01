

const content = document.querySelector('.content');
const navMenuMore = document.querySelector('.nav-menu-more');
const showMore = document.querySelector('.show-more');
const formSearch = document.querySelector('.form-search');
const subscriptionList = document.querySelector('.subscription-list');
const navLinkLiked = document.querySelectorAll('.nav-link-liked');
const navHomeLinked = document.querySelectorAll('.nav-link-home');

// создание карточки для видео
const createCard =(dataVideo) =>{
    const imgUrl = dataVideo.snippet.thumbnails.high.url;
    const titleVideo = dataVideo.snippet.title;
    const videoId = typeof dataVideo.id === 'string' ? dataVideo.id : dataVideo.id.videoId;
    const dateVideo = dataVideo.snippet.publishedAt;
    const channelTitle = dataVideo.snippet.channelTitle;
    const viewCount = dataVideo.statistics?.viewCount;
    const card = document.createElement('li');
    card.classList.add('video-card');
    card.innerHTML = `                        
    <div class="video-thumb">
        <a class="link-video youtube-modal" href="https://www.youtube.com/watch?v=${videoId}">
        <img src="${imgUrl}" alt="" class="thumbnail">
        </a>
    </div>
    <h3 class="video-title">${titleVideo}</h3>
    <div class="video-info">
      <span class="video-counter">
        ${viewCount ? `<span class="video-views">${getViewer(viewCount)}</span>` : ''}   
        <span class="video-date">${getDate(dateVideo)}</span>
      </span>
      <span class="video-channel">${channelTitle}</span>
    </div>`;
    return card;
};

// создание списка видео
const createList = (listVideo, title, clear) =>{
    const channel = document.createElement('section');
    channel.classList.add('channel');
    if (clear){
        content.textContent = '';
    }
    if (title){
        const header = document.createElement('h2');
        header.textContent = title;
        channel.insertAdjacentElement("afterbegin", header);
    }
    const wrapper = document.createElement('ul');
    wrapper.classList.add('video-list');
    channel.insertAdjacentElement('beforeend', wrapper);

    listVideo.forEach( item => {
        const card = createCard(item);
        wrapper.append(card)
    });
    content.insertAdjacentElement("beforeend", channel);
};


const createSubList = listVideo => {
    subscriptionList.textContent = '';
        listVideo.forEach(item => {
            const {title, thumbnails:{high:{url}}, resourceId:{channelId}} = item.snippet;
            const html = `
            <li class="nav-item">
                <a href="http://youtube.com/channel/${channelId}" class="nav-link" data-channel-id="${channelId}" data-title="${title}">
                    <img src="${url}" alt="${title}" class="nav-image">
                    <span class="nav-text">${title}</span>
                </a>
            </li>
            `;
            subscriptionList.insertAdjacentHTML('beforeend', html)
        })
};

// создание дата и просмотры
const getDate = (date) =>{
    const currentDay = Date.parse( new Date() );
    const days = Math.round(currentDay - Date.parse(new Date(date))) / 86400000;
    if (days > 30){
        if (days >60){
            return Math.round(days/30) + 'month ago'
        }
        return  'one month ago'
    }
    if (days > 1){
        return Math.round(days) + 'days ago'
    }
    return 'one day ago'


};

const getViewer = (count) =>{
    if (count >= 1000000){
        return Math.round(count / 1000000) + 'M views';
    }
    if (count >= 1000){
        return Math.round(count / 1000) + 'k views';
    }

    return count + 'views'
};



// youtube API init
const authBtn = document.querySelector('.auth-btn');
const userAvatar = document.querySelector('.user-avatar');

const handleSuccessAuth = data =>{    
    authBtn.classList.add('hide');
    userAvatar.classList.remove('hide');
    userAvatar.src = data.getImageUrl();
    userAvatar.alt = data.getFamilyName();
    requestSubscription(createSubList);
};

const handleNoAuth =() =>{
    authBtn.classList.remove('hide');
    userAvatar.classList.add('hide');
    userAvatar.src = '';
    userAvatar.alt = '';

};

const handleAuth = () =>{
    gapi.auth2.getAuthInstance().signIn();

};

const handleSignOut = () => {
    gapi.auth2.getAuthInstance().signOut();
};

const updateStatusAuth = data => {    
    data.isSignedIn.listen(() => {        
        updateStatusAuth(data);
    })
    if (data.isSignedIn.get()){        
        const userData = data.currentUser.get().getBasicProfile();        
        handleSuccessAuth(userData);
    } else {
        handleNoAuth();
    }
};

function initClient() {
    gapi.client.init({
        'apiKey': API_KEY,
        'clientId': CLIENT_ID,
        'scope': 'https://www.googleapis.com/auth/youtube.readonly',
        'discoveryDocs': ['https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest']
    }).then(() => {
        updateStatusAuth(gapi.auth2.getAuthInstance());
        authBtn.addEventListener('click', handleAuth);
        userAvatar.addEventListener('click', handleSignOut);
    })
        .then(loadScreen)
        .catch(e =>{
        console.warn(e)
    })
}

gapi.load('client:auth2', initClient);

// youtube API init




const requestVideos = (channelId, callback, maxResults = 6) => {
  gapi.client.youtube.search.list({
        part:'snippet',
        channelId,
        maxResults,
        order:'date',
    }).execute( response => {
      callback(response.items)
  })

};

const requestTrending = (callback, maxResults = 6) =>{
    gapi.client.youtube.videos.list({
        part:'snippet, statistics',
        chart:'mostPopular',
        regionCode:'RU',
        maxResults
    }).execute(response =>{
        callback(response.items)
    })
};
const requestMusic = (callback, maxResults = 6) =>{
    gapi.client.youtube.videos.list({
        part:'snippet, statistics',
        chart:'mostPopular',
        regionCode:'RU',
        maxResults,
        videoCategoryId:'10'
    }).execute(response =>{
        callback(response.items)
    })
};

const requestSearch = (searchText, callback, maxResults = 12) => {
    gapi.client.youtube.search.list({
        q:searchText,
        part:'snippet',
        maxResults,
        order:'relevance',
    }).execute( response => {
        callback(response.items);

    })
};

const requestSubscription = (callback, maxResults = 8) => {
    gapi.client.youtube.subscriptions.list({
        part:'snippet',
        mine: true,
        maxResults,
        order:'relevance'
    }).execute( response => {
        callback(response.items);
    })
};

const requestLikes =  (callback, maxResults = 6) =>{
    gapi.client.youtube.videos.list({
        part:' snippet, statistics',
        maxResults,
        myRating:'like',
    }).execute(response => {
        callback(response.items);
    })
};

const loadScreen = () =>{
    requestVideos('UCOynRdpGiTCNFhCgD0RTe1w', data => {
        content.textContent='';
        createList(data,'шиморо');
        requestTrending(data => {
            createList(data,'тренды');
            requestMusic( data => {
                createList(data,'музыка');
            });
        });
    });
};





showMore.addEventListener('click', (event) =>{
    event.preventDefault();
    navMenuMore.classList.toggle('nav-menu-more-show')
});

formSearch.addEventListener('submit', event =>{
    event.preventDefault();
    const value = formSearch.elements.search.value;
    requestSearch(value, data => {
        createList(data, 'результат', true)
    })
});

subscriptionList.addEventListener('click', event =>{
    event.preventDefault();
    const target = event.target;
    const linkChannel = target.closest('.nav-link');
    const channelId =  linkChannel.dataset.channelId;
    const title = linkChannel.dataset.title;
    requestVideos(channelId, data  =>{
        createList(data, title, true)
        }, 12)

});

navLinkLiked.forEach(elem => {
    elem.addEventListener('click', event => {
        event.preventDefault();
        requestLikes(data => {
            createList( data, 'Liked Video', true)
        }, 12)
    });
});

navHomeLinked.forEach(elem =>{
    elem.addEventListener('click', event => {
        event.preventDefault();
        loadScreen();
    })
});
