import Search from './modules/search'
import Chat from './modules/chat'
import RegistrationFrom from './modules/registrationFrom'


if (document.querySelector(".header-search-icon")) {
    new Search()
}

if(document.querySelector("#chat-wrapper")){
    new Chat();
}

if(document.querySelector('#registration-form')){
    new RegistrationFrom()
}